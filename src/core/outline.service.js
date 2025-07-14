const path = require("path");
const cfg = require("../config/env");
const llm = require("../config/llm");
const prompts = require("../infrastructure/promptLoader");
const { createRunDir, write } = require("../infrastructure/fileStore");
const interpolate = require("../utils/interpolate");
const { buildContext } = require("../services/contextBuilder");
const channelRegistry = require("../config/channelRegistry");

const banned = [/yawning tariff/i, /troll[- ]?inspector/i, /frozen beard[- ]?tax/i, /fermented[- ]?shark/i];

async function generateOutline({
  title,
  pov,
  channel,
  // baseDir = path.join(__dirname, "../../outputs"),
  runDir,
  maxRetries = 1,
  chapterCount
}) {
  if (!title || !pov || !channel) {
    throw new Error("Title, POV, and channel are required for outline generation.");
  }

  if (!chapterCount) {
    throw new Error("Chapter count is required for outline generation.");
  }
  // ── A. validate + enrich ---------------------------------------------------
  const ctx = await buildContext({ title, pov });

  const chConfig = channelRegistry[channel];
  if (!chConfig) throw new Error(`Invalid or unknown channel: ${channel}`);

  const promptPath = path.join(chConfig.promptPath, "outline.txt");
  const tpl = prompts.loadRaw(promptPath);

  const systemPrompt = interpolate(tpl, {
    TITLE: ctx.title,
    POV: ctx.pov,
    SETTING: ctx.setting,
    CHAPTER_COUNT: chapterCount,
  });

  // ── B. call model with retry -----------------------------------------------
  let outline, attempts = 0;
  do {
    outline = await llm.chat({
      model: cfg.OUTLINE_MODEL,
      temperature: 1.0,
      top_p: 0.95,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate the full ${chapterCount} chapter outline now.` },
      ],
    });
  } while (attempts++ < maxRetries && banned.some(rx => rx.test(outline)));

  if (!outline) throw new Error("No outline returned by LLM.");

  // ── C. persist artefacts ---------------------------------------------------
  // const runDir = baseDir || createRunDir(path.join(__dirname, "../../outputs"));
  if (!runDir) {
    runDir = createRunDir(path.join(__dirname, "../../outputs"));
  }
  write(path.join(runDir, "prompt-used.txt"), systemPrompt);

  const outlineTitle = `TITLE: ${ctx.title}\n\n${outline.trim()}`;
  write(path.join(runDir, "outline.txt"), outlineTitle);

  return { outline: outlineTitle, runDir };
}

module.exports = { generateOutline };
