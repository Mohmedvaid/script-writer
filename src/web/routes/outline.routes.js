// src/web/routes/outline.routes.js
const express = require("express");
const asyncMW = require("../middlewares/async");
const { generateOutline } = require("../../core/outline.service");

const router = express.Router();

router.post(
  "/outline",
  asyncMW(async (req, res) => {
    // Validate request body
    if (!req.body || typeof req.body !== "object")
      return res.status(400).json({ error: "Invalid request body" });
    if (!req.body.title || typeof req.body.title !== "string")
      return res.status(400).json({ error: "title required" });

    // adding mood
    if (!req.body.mood || typeof req.body.mood !== "string")
      return res.status(400).json({ error: "mood required" });

    const { title, mood } = req.body;

    if (!title?.trim())
      return res.status(400).json({ error: "title required" });

    if (!mood?.trim()) return res.status(400).json({ error: "mood required" });

    const { outline, runDir } = await generateOutline(
      title.trim(),
      mood.trim()
    );
    res.json({ runDir, outline });
  })
);

module.exports = router;
