// src/core/image.service.js
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

const cfg = require("../config/env");
const llm = require("../config/llm");
const prompts = require("../infrastructure/promptLoader");
const { ensureDir, write } = require("../infrastructure/fileStore");
const { extractChapters } = require("../utils/fsHelpers");
const interpolate = require("../utils/interpolate");

/**
 * Generate avatar, cue sheets and DALL·E‑style images for every chapter.
 * @param {string} outlinePath – absolute path to outline.txt
 * @param {string} styleKey    – key in prompts/image_styles/ (default "default")
 */
async function generateImages(outlinePath, styleKey = "default") {
  if (!fs.existsSync(outlinePath))
    throw new Error("outline.txt not found → " + outlinePath);

  const baseDir = path.dirname(outlinePath);
  const outlineText = fs.readFileSync(outlinePath, "utf-8");
  const chapters = extractChapters(outlineText, cfg.CHAPTER_COUNT);

  /* ── directories */
  const imgRoot = path.join(baseDir, "images");
  const genRoot = path.join(imgRoot, "generated");
  ensureDir(genRoot);

  /* ── 1. Avatar */
  const avatarPrompt = interpolate(prompts.load("avatar"), {
    OUTLINE: outlineText,
  });
  console.log("🎭 Generating avatar …");
  const avatarText = await llm.chat({
    model: cfg.IMAGE_TEXT_MODEL,
    temperature: 0.85,
    top_p: 0.9,
    messages: [
      { role: "system", content: avatarPrompt },
      { role: "user", content: "Proceed." },
    ],
  });
  write(path.join(imgRoot, "avatar.txt"), avatarText);

  /* ── static templates */
  const cueTemplate = prompts.load("images_only");
  const styleTemplate = prompts.loadStyle(styleKey);
  const avatarSnippet = avatarText.split("\n").slice(0, 3).join(" ");

  /* ── 2. Per‑chapter loops */
  for (let i = 0; i < chapters.length; i++) {
    const num = i + 1;
    const chapterTxt = chapters[i];

    const cuePrompt = interpolate(cueTemplate, {
      CHAPTER_CONTENT: chapterTxt,
      IMAGES_PER_CHAPTER: cfg.IMAGES_PER_CHAPTER,
    });

    console.log(`🧠 Cues for Chapter ${num} …`);
    const cues = await llm.chat({
      model: cfg.IMAGE_TEXT_MODEL,
      temperature: 0.85,
      top_p: 0.9,
      messages: [
        { role: "system", content: cuePrompt },
        { role: "user", content: "Proceed." },
      ],
    });

    const cueFile = path.join(
      imgRoot,
      `chapter-${String(num).padStart(2, "0")}-cues.txt`
    );
    write(cueFile, cues);

    const matches = [...cues.matchAll(/^#\d+\s+(.*?)\nScene\s*–\s*(.*?)$/gim)];
    if (!matches.length) {
      console.warn(`⚠️ No cues parsed for chapter ${num}`);
      continue;
    }

    const chapterDir = path.join(
      genRoot,
      `chapter-${String(num).padStart(2, "0")}`
    );
    ensureDir(chapterDir);

    for (let j = 0; j < matches.length && j < cfg.IMAGES_PER_CHAPTER; j++) {
      const scene = matches[j][2].trim();

      const dallePrompt = interpolate(styleTemplate, {
        SCENE: scene,
        AVATAR_SNIPPET: avatarSnippet,
      });

      const [url] = await llm.image({
        model: cfg.IMAGE_MODEL,
        prompt: dallePrompt,
        n: 1,
        size: "1792x1024",
      });
      if (!url) throw new Error("LLM image URL missing.");

      const buffer = await (await fetch(url)).arrayBuffer();
      const outImg = path.join(chapterDir, `image-${j + 1}.png`);
      fs.writeFileSync(outImg, Buffer.from(buffer));
      console.log(`🎨  chapter ${num} → image ${j + 1}`);
    }
  }

  console.log("🎉 All images generated.");
}

module.exports = { generateImages };
