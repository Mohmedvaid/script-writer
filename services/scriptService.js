const fs = require("fs");
const path = require("path");
const { OpenAI } = require("openai");
const { OPENAI_API_KEY } = require("../config/env");

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const MODEL = "gpt-4o";

function loadScriptPrompt(outlineText) {
  const basePrompt = fs.readFileSync(
    path.join(__dirname, "../prompts/script.txt"),
    "utf-8"
  );
  return basePrompt.replace("{generated outline}", outlineText.trim());
}

function formatChapterFilename(chapterNum) {
  return `chapter-${String(chapterNum).padStart(2, "0")}.txt`;
}

class ScriptWriterSession {
  constructor(outline, outputDir) {
    if (!outline)
      throw new Error("Outline is required to start script session.");
    this.outputDir = outputDir;
    this.history = [
      {
        role: "system",
        content: loadScriptPrompt(outline),
      },
      {
        role: "user",
        content: "Start with Chapter 1.",
      },
    ];
    this.chapter = 1;
    fs.mkdirSync(this.outputDir, { recursive: true });
  }

  async generateNextChapter() {
    console.log(`✍️ Generating Chapter ${this.chapter} using ${MODEL}...`);
    const res = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.8,
      top_p: 0.95,
      messages: this.history,
    });

    const content = res.choices?.[0]?.message?.content?.trim();
    if (!content || !content.includes("--END OF CHAPTER")) {
      throw new Error("Incomplete or malformed chapter content.");
    }

    const filename = path.join(
      this.outputDir,
      formatChapterFilename(this.chapter)
    );
    fs.writeFileSync(filename, content);
    console.log(`✅ Saved Chapter ${this.chapter} to ${filename}`);

    this.history.push({ role: "assistant", content });
    this.history.push({ role: "user", content: "Next" });
    this.chapter += 1;

    return content;
  }
}

module.exports = {
  ScriptWriterSession,
};
