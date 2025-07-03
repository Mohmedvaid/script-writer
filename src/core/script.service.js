// src/core/script.service.js
const path = require("path");
const cfg = require("../config/env");
const llm = require("../config/llm");
const prompts = require("../infrastructure/promptLoader");
const { ensureDir, write } = require("../infrastructure/fileStore");
const interpolate = require("../utils/interpolate");

/* ────────────────────────────────────────────────────────── *
   ScriptWriterSession
   – Streams 15 chapters sequentially, persisting each to disk.
* ────────────────────────────────────────────────────────── */
class ScriptWriterSession {
  /**
   * @param {string} outlineText         Raw outline text
   * @param {string} runDir              Directory to save chapter files
   * @param {object} [opts]              { title?, mascotName? }
   */
  constructor(outlineText, runDir, opts = {}) {
    if (!outlineText) throw new Error("Outline text is required.");
    if (!runDir) throw new Error("runDir is required.");

    this.runDir = runDir;
    this.chapter = 1;

    /* fill all placeholders in prompts/script.txt */
    const systemPrompt = interpolate(prompts.load("script"), {
      OUTLINE: outlineText.trim(),
      TITLE: opts.title || "",
      MASCOT: opts.mascotName || "Reginald the possum",
    });

    this.history = [
      { role: "system", content: systemPrompt },
      { role: "user", content: "Start with Chapter 1." },
    ];

    ensureDir(this.runDir);
  }

  async generateNext() {
    if (this.chapter > cfg.CHAPTER_COUNT)
      throw new Error("All chapters generated.");

    const modelName = cfg.SCRIPT_MODEL || cfg.OUTLINE_MODEL;
    console.log(`✍️  Generating Chapter ${this.chapter} using ${modelName}`);

    const content = await llm.chat({
      model: modelName,
      temperature: 0.8,
      top_p: 0.95,
      messages: this.history,
    });

    if (!content || !content.includes("--END OF CHAPTER"))
      throw new Error("Chapter content missing terminator.");

    const fileName = `chapter-${String(this.chapter).padStart(2, "0")}.txt`;
    write(path.join(this.runDir, fileName), content);

    this.history.push({ role: "assistant", content });
    this.history.push({ role: "user", content: "Next" });
    this.chapter += 1;
    return content;
  }

  chaptersRemaining() {
    return cfg.CHAPTER_COUNT - this.chapter + 1;
  }
}


module.exports = { ScriptWriterSession };
