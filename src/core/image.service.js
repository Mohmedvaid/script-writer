/* ────────────────────────────────────────────────────────── *
   src/core/image.service.js
   Generate avatar (optional), image prompts, and renders
* ────────────────────────────────────────────────────────── */
const fs = require("fs");
const path = require("path");

const cfg = require("../config/env");
const llm = require("../config/llm");
const prompts = require("../infrastructure/promptLoader");
const { ensureDir, write } = require("../infrastructure/fileStore");
const { extractChapters } = require("../utils/fsHelpers");
const interpolate = require("../utils/interpolate");

/**
 * @param {object} plan  The plan object returned by planBuilder
 */
async function generateImages(plan) {
  /* ── sanity checks ── */
  const runDir = plan.runDir;
  if (!runDir) throw new Error("runDir is required on plan");
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
      prompts.load(path.join(plan.promptPath, "avatar")),
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
  const cueTemplate = prompts.load(path.join(plan.promptPath, "images_only"));
  const styleTemplate = prompts.loadStyle(plan.styleKey);

  /* ── 2. Per‑chapter loop ── */
  for (let i = 0; i < chapters.length; i++) {
    const chapterNo = i + 1;
    const chapText = chapters[i];

    const cuePrompt = interpolate(cueTemplate, {
      CHAPTER_CONTENT: chapText,
      IMAGES_PER_CHAPTER: plan.imagesPerChapter,
    });

    console.log(`🧠 Cues for Chapter ${chapterNo} …`);
    const cues = await llm.chat({
      model: cfg.IMAGE_TEXT_MODEL,
      temperature: 0.85,
      top_p: 0.9,
      messages: [
        { role: "system", content: cuePrompt },
        { role: "user", content: "Proceed." },
      ],
    });

    /* save raw cue text */
    write(
      path.join(imgRoot, `chapter-${String(chapterNo).padStart(2, "0")}-cues.txt`),
      cues
    );

    /* tolerant two‑line cue parser */
    const lines = cues.split("\n").map(l => l.trim()).filter(Boolean);
    const scenes = [];
    for (let k = 0; k < lines.length - 1; k++) {
      const titleOK = /^#?\d+\s+/.test(lines[k]);              // allow '#' or not
      const sceneOK = /^Scene\s*[-–—:]\s+/.test(lines[k + 1]); // any dash / colon
      if (titleOK && sceneOK) {
        scenes.push(lines[k + 1].replace(/^Scene\s*[-–—:]\s*/, ""));
        k++;   // skip scene line
      }
    }

    /* log parsed scenes for inspection */
    write(
      path.join(imgRoot, `chapter-${String(chapterNo).padStart(2, "0")}-scenes.json`),
      JSON.stringify(scenes, null, 2)
    );

    if (!scenes.length) {
      /* keep cues for debugging, skip to next chapter */
      write(
        path.join(
          imgRoot,
          `chapter-${String(chapterNo).padStart(2, "0")}-PARSE-ERROR.txt`
        ),
        cues
      );
      console.warn(`⚠️  Chapter ${chapterNo}: cue parse failed, skipping images.`);
      continue;
    }

    const chapterDir = path.join(genRoot, `chapter-${String(chapterNo).padStart(2, "0")}`);
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

      /* copy to flat “all” folder */
      ensureDir(path.join(imgRoot, "all"));
      fs.copyFileSync(
        outPath,
        path.join(imgRoot, "all", `chapter-${chapterNo}-image-${j + 1}.png`)
      );

      console.log(`🎨 Chapter ${chapterNo} → image ${j + 1}`);
    }
  }

  console.log("🎉 All images generated.");
  return {
    imagesDir: "images/all",
    imagesGenerated: plan.chapterCount * plan.imagesPerChapter,
  };
}

module.exports = { generateImages };
