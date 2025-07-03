// src/core/outline.service.js
const path = require("path");
const cfg = require("../config/env");
const llm = require("../config/llm");
const prompts = require("../infrastructure/promptLoader");
const { createRunDir, write } = require("../infrastructure/fileStore");
const interpolate = require("../utils/interpolate");

/**
 * Generate a 15‑chapter outline and persist artefacts in outputs/<timestamp>/
 *
 * @param {string} videoTitle  – required, plain text title.
 * @param {string} [baseDir]   – parent dir for run folders (default: /outputs)
 * @returns {Promise<{ outline: string, runDir: string }>}
 */
async function generateOutline(
  videoTitle,
  baseDir = path.join(__dirname, "../../outputs")
) {
  if (!videoTitle?.trim()) throw new Error("Video title is required.");

  /* ── 1. prepare prompt */
  const tpl = prompts.load("outline"); // promps/outline.txt
  const systemPrompt = interpolate(tpl, { TITLE: videoTitle.trim() });

  /* ── 2. call LLM */
  console.log(`🧠 Outline | model: ${cfg.OUTLINE_MODEL}`);
  const outline = await llm.chat({
    model: cfg.OUTLINE_MODEL,
    temperature: 0.85,
    top_p: 0.9,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: "Generate the full 15‑chapter outline now." },
    ],
  });

  if (!outline) throw new Error("No outline returned by LLM.");

  /* ── 3. persist run artefacts */
  const runDir = createRunDir(baseDir);
  write(path.join(runDir, "prompt-used.txt"), systemPrompt);
  write(path.join(runDir, "outline.txt"), outline);

  return { outline, runDir };
}

module.exports = { generateOutline };
