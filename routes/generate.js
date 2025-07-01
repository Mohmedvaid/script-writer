const express = require("express");
const path = require("path");
const { generateOutline } = require("../services/outlineService");
const { ScriptWriterSession } = require("../services/scriptService");
const { generateImagesFromOutline } = require("../services/imageService");

const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    const title = req.body.title?.trim();
    if (!title) return res.status(400).send("Missing video title.");

    // Step 1: Generate Outline
    // const { outline, path: outputDir } = await generateOutline(
    //   title,
    //   path.join(__dirname, "../outputs")
    // );

    // Step 2: Generate all 15 chapters
    // const writer = new ScriptWriterSession(outline, outputDir);
    // let scriptFullText = "";

    // for (let i = 0; i < 15; i++) {
    //   const chapter = await writer.generateNextChapter();
    //   scriptFullText += `\n\n${chapter}`;
    // }
    // for temp make output dir outputs/2025-07-01T20-36-37-375Z/outline.txt
    const outputDir = path.join(
      __dirname,
      "../outputs/2025-07-01T20-36-37-375Z"
    );

    await generateImagesFromOutline(outputDir);

    res.render("index", { title, outline: null, script: scriptFullText });
  } catch (err) {
    console.error("❌ Script generation failed:", err.message);
    next(err);
  }
});

module.exports = router;
