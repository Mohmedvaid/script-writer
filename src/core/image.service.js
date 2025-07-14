// src/core/image.service.js

const fs = require("fs");
const path = require("path");
const cfg = require("../config/env");
const llm = require("../config/llm");
const prompts = require("../infrastructure/promptLoader");
const { ensureDir, write } = require("../infrastructure/fileStore");
const { extractChapters } = require("../utils/fsHelpers");
const interpolate = require("../utils/interpolate");

/**
 * @param {object} args { runDir: string, plan: object }
 * plan is the same object returned by planBuilder
 */
async function generateImages(plan) {
  /* ── sanity checks ── */
  const runDir = plan.runDir;
  if (!runDir) throw new Error("runDir is required.");
  const outlinePath = path.join(runDir, "outline.txt");
  if (!fs.existsSync(outlinePath))
    throw new Error("outline.txt not found in " + runDir);

  const outlineText = fs.readFileSync(outlinePath, "utf-8");
  const chapters = extractChapters(outlineText, plan.chapterCount);

  /* ── directories ── */
  const imgRoot = path.join(runDir, "images");
  const genRoot = path.join(imgRoot, "generated");
  ensureDir(genRoot);

  /* ── 1. Avatar (if required) ── */
  let avatarSnippet = "";
  if (plan.avatarRequired) {
    const avatarPrompt = interpolate(
      prompts.load(path.join(plan.promptPath, "avatar.txt")),
      { OUTLINE: outlineText }
    );
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
    avatarSnippet = avatarText.split("\n").slice(0, 3).join(" ");
  }

  /* ── static templates ── */
  const cueTemplate = prompts.load(
    path.join(plan.promptPath, "images_only.txt")
  );
  const styleTemplate = prompts.loadStyle(plan.styleKey);

  /* ── 2. Per‑chapter loop ── */
  for (let i = 0; i < chapters.length; i++) {
    const num = i + 1;
    const chap = chapters[i];

    const cuePrompt = interpolate(cueTemplate, {
      CHAPTER_CONTENT: chap,
      IMAGES_PER_CHAPTER: plan.imagesPerChapter,
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

    write(
      path.join(imgRoot, `chapter-${String(num).padStart(2, "0")}-cues.txt`),
      cues
    );

    /* quick two‑line cue parser */
    const lines = cues
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const scenes = [];
    for (let k = 0; k < lines.length - 1; k++) {
      if (/^#\d+\s/.test(lines[k]) && /^Scene\s[–-]/.test(lines[k + 1])) {
        scenes.push(lines[k + 1].replace(/^Scene\s[–-]\s*/, ""));
        k++;
      }
    }
    if (!scenes.length) throw new Error(`No cues parsed for chapter ${num}`);

    const chapterDir = path.join(
      genRoot,
      `chapter-${String(num).padStart(2, "0")}`
    );
    ensureDir(chapterDir);

    for (let j = 0; j < scenes.length && j < plan.imagesPerChapter; j++) {
      const finalPrompt = interpolate(styleTemplate, {
        SCENE: scenes[j],
        AVATAR_SNIPPET: avatarSnippet,
      });
      write(path.join(chapterDir, `prompt-${j + 1}.txt`), finalPrompt);

      const imgs = await llm.image({
        model: cfg.IMAGE_MODEL,
        prompt: finalPrompt,
        n: 1,
        size: plan.imageSize || "1024x1024",
        quality: cfg.IMAGE_QUALITY,
      });
      const buf = imgs?.[0];
      if (!buf) continue;

      const outPath = path.join(chapterDir, `image-${j + 1}.png`);
      fs.writeFileSync(outPath, buf);

      ensureDir(path.join(imgRoot, "all"));
      fs.copyFileSync(
        outPath,
        path.join(imgRoot, "all", `chapter-${num}-image-${j + 1}.png`)
      );

      console.log(`🎨 Chapter ${num} → image ${j + 1}`);
    }
  }

  console.log("🎉 All images generated.");
  return {
    imagesDir: "images/all",
    imagesGenerated: plan.chapterCount * plan.imagesPerChapter,
  };
}

module.exports = { generateImages };
