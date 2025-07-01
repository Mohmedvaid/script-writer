const fs = require("fs");
const path = require("path");
const { OpenAI } = require("openai");
const {
  OPENAI_API_KEY,
  IMAGE_MODEL,
  IMAGE_TEXT_MODEL,
  IMAGES_PER_CHAPTER,
  CHAPTER_COUNT,
} = require("../config/env");

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const promptsDir = path.join(__dirname, "../prompts");

function extractChaptersFromOutline(outline) {
  const matches = [
    ...outline.matchAll(/^CHAPTER\s+\d+\s+–[\s\S]+?(?=^CHAPTER\s+\d+\s+–|$)/gm),
  ];
  if (matches.length < Number(CHAPTER_COUNT)) {
    throw new Error(
      `Expected ${CHAPTER_COUNT} chapters but found ${matches.length}`
    );
  }
  return matches.slice(0, CHAPTER_COUNT).map((m) => m[0].trim());
}

function interpolate(template, values) {
  return template.replace(/{{(.*?)}}/g, (_, key) => values[key.trim()] ?? "");
}

async function callGPT(prompt) {
  const res = await openai.chat.completions.create({
    model: IMAGE_TEXT_MODEL,
    temperature: 0.85,
    top_p: 0.9,
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: "Proceed." },
    ],
  });

  const content = res.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("No content returned from GPT.");
  return content;
}

async function generateImage(prompt, outPath) {
  const res = await openai.images.generate({
    model: IMAGE_MODEL,
    prompt,
    n: 1,
    size: "1792x1024",
    response_format: "url",
  });

  const url = res.data?.[0]?.url;
  if (!url) throw new Error("Image URL not returned by OpenAI.");

  const imageRes = await fetch(url);
  const buffer = await imageRes.arrayBuffer();
  fs.writeFileSync(outPath, Buffer.from(buffer));
}

async function generateImagesFromOutline(outputDir) {
  const outlinePath = path.join(outputDir, "outline.txt");
  if (!fs.existsSync(outlinePath)) {
    throw new Error(`Missing outline.txt at: ${outlinePath}`);
  }

  const outlineText = fs.readFileSync(outlinePath, "utf-8");
  const chapters = extractChaptersFromOutline(outlineText);

  const avatarPromptTemplate = fs.readFileSync(
    path.join(promptsDir, "avatar.txt"),
    "utf-8"
  );
  const imagePromptTemplate = fs.readFileSync(
    path.join(promptsDir, "images_only.txt"),
    "utf-8"
  );

  // STEP 1 – Avatar
  console.log("🎭 Generating avatar...");
  const avatarPrompt = interpolate(avatarPromptTemplate, {
    OUTLINE: outlineText,
  });
  const avatarText = await callGPT(avatarPrompt);
  fs.writeFileSync(path.join(outputDir, "avatar.txt"), avatarText);
  console.log("✅ Avatar saved.");

  // STEP 2 – Image cues + images
  const imgRoot = path.join(outputDir, "images");
  const genRoot = path.join(imgRoot, "generated");
  fs.mkdirSync(genRoot, { recursive: true });

  for (let i = 0; i < chapters.length; i++) {
    const chapterNum = i + 1;
    const chapterText = chapters[i];

    const finalPrompt = interpolate(imagePromptTemplate, {
      CHAPTER_CONTENT: chapterText,
      IMAGES_PER_CHAPTER,
    });

    console.log(`🧠 Generating image cues for Chapter ${chapterNum}...`);
    const content = await callGPT(finalPrompt);

    const textFile = `chapter-${String(chapterNum).padStart(
      2,
      "0"
    )}-images.txt`;
    fs.writeFileSync(path.join(imgRoot, textFile), content);

    const cueMatches = [
      ...content.matchAll(/^#\d+\s+(.*?)\nScene\s*–\s*(.*?)$/gim),
    ];
    if (cueMatches.length === 0) {
      console.warn(`⚠️ No cues found for chapter ${chapterNum}`);
      continue;
    }

    const chapterFolder = path.join(
      genRoot,
      `chapter-${String(chapterNum).padStart(2, "0")}`
    );
    fs.mkdirSync(chapterFolder, { recursive: true });

    for (let j = 0; j < cueMatches.length && j < IMAGES_PER_CHAPTER; j++) {
      const title = cueMatches[j][1].trim();
      const scene = cueMatches[j][2].trim();
      const dallePrompt = `${title}. ${scene}. Style: medieval illuminated manuscript, parchment texture, flat outlined figures.`;

      const outPath = path.join(chapterFolder, `image-${j + 1}.png`);
      console.log(`🎨 [Ch ${chapterNum}] Image ${j + 1}: ${title}`);
      await generateImage(dallePrompt, outPath);
    }

    console.log(`✅ Chapter ${chapterNum} complete.`);
  }

  console.log("🎉 All images and avatar complete.");
}

module.exports = {
  generateImagesFromOutline,
};
