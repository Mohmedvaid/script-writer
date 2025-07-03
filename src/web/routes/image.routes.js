const express = require("express");
const asyncMW = require("../middlewares/async");
const { generateImages } = require("../../core/image.service");
const prompts = require("../../infrastructure/promptLoader");
const path = require("path");
const fs = require("fs");

const router = express.Router();

router.post(
  "/images",
  asyncMW(async (req, res) => {
    const { outlinePath, styleKey = "tapestry" } = req.body;

    if (!outlinePath || !fs.existsSync(outlinePath)) {
      return res.status(400).json({ error: "outlinePath missing or invalid" });
    }

    /* validate style key early */
    try {
      prompts.loadStyle(styleKey);
    } catch (e) {
      console.error(`Error loading style '${styleKey}':`, e);
      return res.status(400).json({ error: `unknown styleKey '${styleKey}'` });
    }

    await generateImages(path.resolve(outlinePath), styleKey);
    res.json({ status: "images generated", style: styleKey });
  })
);

module.exports = router;
