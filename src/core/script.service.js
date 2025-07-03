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
   * @param {string} outlineText – raw outline from outline service
   * @param {string} runDir      – directory to save chapter files
   */
  constructor(outlineText, runDir) {
    if (!outlineText) throw new Error("Outline text is required.");
    if (!runDir) throw new Error("runDir is required.");

    this.runDir = runDir;
    this.chapter = 1;

    const systemPrompt = interpolate(prompts.load("script"), {
      OUTLINE: outlineText.trim(),
    });

    // conversation history that grows per chapter
    this.history = [
      { role: "system", content: systemPrompt },
      { role: "user", content: "Start with Chapter 1." },
    ];

    ensureDir(this.runDir);
  }

  /** Generate current chapter and advance pointer */
  async generateNext() {
    if (this.chapter > cfg.CHAPTER_COUNT)
      throw new Error("All chapters generated.");

    console.log(
      `✍️  Generating Chapter ${this.chapter} using ${cfg.OUTLINE_MODEL}`
    );

    const content = await llm.chat({
      model: cfg.OUTLINE_MODEL,
      temperature: 0.8,
      top_p: 0.95,
      messages: this.history,
    });

    if (!content || !content.includes("--END OF CHAPTER")) {
      throw new Error("Chapter content missing --END OF CHAPTER marker.");
    }

    const fileName = `chapter-${String(this.chapter).padStart(2, "0")}.txt`;
    write(path.join(this.runDir, fileName), content);

    // update chat history for continuity
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
