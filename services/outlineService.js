const fs = require("fs");
const path = require("path");
const { OpenAI } = require("openai");
const {
  OUTLINE_MODEL,
  OPENAI_API_KEY,
  OUTLINE_PATH,
} = require("../config/env");

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

function loadPromptTemplate() {
  try {
    const raw = fs.readFileSync(OUTLINE_PATH, "utf-8");
    if (!raw.includes("VIDEO TITLE")) {
      throw new Error("Prompt template missing 'VIDEO TITLE' placeholder.");
    }
    return raw;
  } catch (err) {
    throw new Error("Failed to load outline prompt template: " + err.message);
  }
}

function replaceTitleInPrompt(template, title) {
  const updated = template.replace(
    /VIDEO TITLE\s*:\s*".*?"/,
    `VIDEO TITLE  : "${title}"`
  );
  if (!updated.includes(`"${title}"`)) {
    throw new Error("Failed to update title in prompt template.");
  }
  return updated;
}

async function generateOutline(title, outputDir) {
  if (!title?.trim()) throw new Error("Video title is required.");
  if (!OUTLINE_MODEL) throw new Error("No outline model defined.");

  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const fullDir = path.join(outputDir, ts);
  fs.mkdirSync(fullDir, { recursive: true });

  const template = loadPromptTemplate();
  const finalPrompt = replaceTitleInPrompt(template, title);

  console.log(`🧠 Using model: ${OUTLINE_MODEL}`);
  console.log(`📝 Prompt generated for title: "${title}"`);

  const response = await openai.chat.completions.create({
    model: OUTLINE_MODEL,
    temperature: 0.85,
    top_p: 0.9,
    messages: [
      { role: "system", content: finalPrompt },
      { role: "user", content: "Generate the full 15-chapter outline now." },
    ],
  });

  const outline = response.choices?.[0]?.message?.content?.trim();
  if (!outline) throw new Error("No outline returned by OpenAI.");

  fs.writeFileSync(path.join(fullDir, "prompt-used.txt"), finalPrompt);
  fs.writeFileSync(path.join(fullDir, "outline.txt"), outline);

  console.log(`✅ Outline written to ${fullDir}`);
  return { outline, path: fullDir };
}

module.exports = {
  generateOutline,
};
