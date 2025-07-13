const fs = require("fs");
const path = require("path");

const cfg = require("../config/env");
const llm = require("../config/llm");
const prompts = require("../infrastructure/promptLoader");
const { ensureDir, write } = require("../infrastructure/fileStore");
const { extractChapters } = require("../utils/fsHelpers");
const interpolate = require("../utils/interpolate");

/**
 * Generate avatar, cue sheets and GPT-Image-1 renders for every chapter.
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

    /* ── new block-based cue parser */
    const lines = cues.split("\n").map(line => line.trim()).filter(Boolean);
    const matches = [];
    for (let k = 0; k < lines.length - 1; k++) {
      const titleLine = lines[k];
      const sceneLine = lines[k + 1];

      if (
        /^#\d+\s+.+/.test(titleLine) &&
        /^Scene\s*[-–—:]\s+.+/.test(sceneLine)
      ) {
        matches.push([titleLine, sceneLine]);
        k++; // skip the scene line
      }
    }

    if (!matches.length) {
      const errSnippet = cues.slice(0, 1000).replace(/\n/g, "\\n");
      throw new Error(
        `❌ Chapter ${num}: No cues parsed.\nReason: Expected "#n Title" followed by "Scene – ..."\nCue text:\n${errSnippet}`
      );
    }

    const chapterDir = path.join(
      genRoot,
      `chapter-${String(num).padStart(2, "0")}`
    );
    ensureDir(chapterDir);

    for (let j = 0; j < matches.length && j < cfg.IMAGES_PER_CHAPTER; j++) {
      const scene = matches[j][1].trim();

      const finalPrompt = interpolate(styleTemplate, {
        SCENE: scene,
        AVATAR_SNIPPET: avatarSnippet,
      });
      // write final prompt to file
      write(path.join(chapterDir, `prompt-${j + 1}.txt`), finalPrompt);

      const imageBuffers = await llm.image({
        model: cfg.IMAGE_MODEL,
        prompt: finalPrompt,
        n: 1,
        size:
          cfg.IMAGE_SIZE === "landscape"
            ? "1536x1024"
            : cfg.IMAGE_SIZE === "portrait"
              ? "1024x1536"
              : "1024x1024",
        quality: cfg.IMAGE_QUALITY,
      });

      const buffer = imageBuffers?.[0];
      if (!buffer) {
        console.warn(`❌ No image returned for chapter ${num}, image ${j + 1}`);
        continue;
      }

      const outImg = path.join(chapterDir, `image-${j + 1}.png`);
      fs.writeFileSync(outImg, buffer);

      const allDir = path.join(imgRoot, "all");
      ensureDir(allDir);

      const allImg = path.join(allDir, `chapter-${num}-image-${j + 1}.png`);
      fs.copyFileSync(outImg, allImg);

      console.log(`🎨  chapter ${num} → image ${j + 1}`);
    }
  }

  console.log("🎉 All images generated.");
}

module.exports = { generateImages };
