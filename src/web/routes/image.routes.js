// ───────────────────────────────────────
// src/web/routes/image.routes.js
const express3 = require("express");
const asyncMW3 = require("../middlewares/async");
const { generateImages } = require("../../core/image.service");
const path3 = require("path");
const fs3 = require("fs");

const router3 = express3.Router();

router3.post(
  "/images",
  asyncMW3(async (req, res) => {
    const { outlinePath, styleKey } = req.body;
    if (!outlinePath || !fs3.existsSync(outlinePath)) {
      return res.status(400).json({ error: "outlinePath missing or invalid" });
    }

    await generateImages(path3.resolve(outlinePath), styleKey || "default");
    res.json({ status: "images generated", style: styleKey || "default" });
  })
);

module.exports = router3;
