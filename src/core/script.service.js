// src/core/script.service.js
const path = require("path");
const fs = require("fs");
const cfg = require("../config/env");
const llm = require("../config/llm");
const prompts = require("../infrastructure/promptLoader");
const { ensureDir, write } = require("../infrastructure/fileStore");
const interpolate = require("../utils/interpolate");

/* ────────────────────────────────────────────────────────── *
   ScriptWriterSession
   – Streams N chapters sequentially, persists each under runDir/script/
* ────────────────────────────────────────────────────────── */
class ScriptWriterSession {
  /**
   * @param {string} outlineText         Raw outline text
   * @param {string} runDir              Job directory created by outline service
   * @param {object} [opts]              { title?: string }
   */
  constructor(outlineText, runDir, opts = {}) {
    if (!outlineText) throw new Error("Outline text is required.");
    if (!runDir) throw new Error("runDir is required.");

    this.runDir = runDir;
    this.scriptDir = path.join(runDir, "script");
    this.chapter = 1;

    /* create /script folder inside the run */
    ensureDir(this.scriptDir);

    /* fill placeholders in prompts/script.txt */
    const systemPrompt = interpolate(prompts.load("script"), {
      OUTLINE: outlineText.trim(),
      TITLE: opts.title || "",
    });

    this.history = [
      { role: "system", content: systemPrompt },
      { role: "user", content: "Start with Chapter 1." },
    ];
  }

  /** Generate the current chapter, persist to /script, then advance pointer */
  async generateNext() {
    if (this.chapter > cfg.SCRIPT_CHAPTER_COUNT)
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
    const filePath = path.join(this.scriptDir, fileName);
    write(filePath, content);

    // Append to master file with only a line break
    const masterFilePath = path.join(this.scriptDir, "all-chapters.txt");
    fs.appendFileSync(masterFilePath, content + "\n\n");

    this.history.push({ role: "assistant", content });
    this.history.push({ role: "user", content: "Next" });
    this.chapter += 1;
    return content;
  }

  chaptersRemaining() {
    return cfg.SCRIPT_CHAPTER_COUNT - this.chapter + 1;
  }
}

module.exports = { ScriptWriterSession };
