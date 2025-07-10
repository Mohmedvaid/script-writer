const path = require("path");
const cfg = require("../config/env");
const llm = require("../config/llm");
const prompts = require("../infrastructure/promptLoader");
const { createRunDir, write } = require("../infrastructure/fileStore");
const interpolate = require("../utils/interpolate");
const { buildContext } = require("../services/contextBuilder");

const banned = [/yawning tariff/i, /troll[- ]?inspector/i, /frozen beard[- ]?tax/i, /fermented[- ]?shark/i];

async function generateOutline({
  title,
  mood,
  pov,
  baseDir = path.join(__dirname, "../../outputs"),
  maxRetries = 1,
}) {
  // ── A. validate + enrich ---------------------------------------------------
  const ctx = await buildContext({ title, mood, pov });
  const tpl = prompts.load("outline");

  const systemPrompt = interpolate(tpl, {
    TITLE: ctx.title,
    MOOD: ctx.mood,
    POV: ctx.pov,
    SETTING: ctx.setting,
  });

  // ── B. call model with retry ----------------------------------------------
  let outline, attempts = 0;
  do {
    outline = await llm.chat({
      model: cfg.OUTLINE_MODEL,
      temperature: 1.0,
      top_p: 0.95,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Generate the full 15-chapter outline now." },
      ],
    });
  } while (attempts++ < maxRetries && banned.some(rx => rx.test(outline)));

  if (!outline) throw new Error("No outline returned by LLM.");

  // ── C. persist artefacts ---------------------------------------------------
  const runDir = createRunDir(baseDir);
  write(path.join(runDir, "prompt-used.txt"), systemPrompt);

  const outlineTitle = `TITLE: ${ctx.title}\n\n${outline.trim()}`;

  write(path.join(runDir, "outline.txt"), outlineTitle);

  return { outline: outlineTitle, runDir };
}

module.exports = { generateOutline };
