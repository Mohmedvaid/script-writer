// ───────────────────────────────────────
// src/web/routes/script.routes.js
const express2 = require("express");
const asyncMW2 = require("../middlewares/async");
const { ScriptWriterSession } = require("../../core/script.service");
const path = require("path");
const fs = require("fs");

const router2 = express2.Router();

router2.post(
  "/script",
  asyncMW2(async (req, res) => {
    // Validate request body
    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({ error: "Invalid request body" });
    }
    if (!req.body.title || typeof req.body.title !== "string") {
      return res.status(400).json({ error: "title required" });
    }
    const { title, mascotName } = req.body;
    if (!title?.trim()) {
      return res.status(400).json({ error: "title required" });
    }
    if (mascotName && typeof mascotName !== "string") {
      return res.status(400).json({ error: "mascotName must be a string" });
    }
    if (mascotName && !mascotName.trim()) {
      return res.status(400).json({ error: "mascotName cannot be empty" });
    }
    // Validate runDir and outline.txt existence
    if (!req.body.runDir || typeof req.body.runDir !== "string") {
      return res.status(400).json({ error: "runDir required" });
    }
    if (!fs.existsSync(req.body.runDir)) {
      return res.status(400).json({ error: "runDir does not exist" });
    }
    if (!fs.existsSync(path.join(req.body.runDir, "outline.txt"))) {
      return res.status(400).json({ error: "outline.txt not found in runDir" });
    }

    const { runDir } = req.body;
    if (!runDir || !fs.existsSync(path.join(runDir, "outline.txt"))) {
      return res.status(400).json({ error: "invalid runDir" });
    }

    const outline = fs.readFileSync(path.join(runDir, "outline.txt"), "utf-8");
    const writer = new ScriptWriterSession(outline, runDir, {
      title,
      mascotName,
    });

    const chapters = [];
    for (let i = 0; i < 15; i++) {
      chapters.push(await writer.generateNext());
    }

    res.json({ chaptersWritten: chapters.length, runDir });
  })
);

module.exports = router2;
