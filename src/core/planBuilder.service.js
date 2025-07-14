/* ────────────────────────────────────────────────────────── *
   src/core/planBuilder.service.js
   Builds plan.json (outline only for now)
* ────────────────────────────────────────────────────────── */
const path = require("path");
const { createRunDir, write } = require("../infrastructure/fileStore");
const channelRegistry = require("../config/channelRegistry");
const cfg = require("../config/env");

/** heuristically convert token capacity to safe char capacity */
const FIXED_SEGMENT_CHARS = 4_000;

function buildPlan({ title, pov, channel, styleKey }) {
  const reg = channelRegistry[channel];
  if (!reg) throw new Error(`Unknown channel '${channel}'`);

  if (!reg.styles.includes(styleKey))
    throw new Error(`styleKey '${styleKey}' not allowed for ${channel}`);

  if (!reg.povOptions.includes(pov))
    throw new Error(`pov '${pov}' not allowed for ${channel}`);

  const target = reg.targetScriptChars;
  const segmentChars = Math.min(target, FIXED_SEGMENT_CHARS);
  const chapterCount = Math.ceil(target / segmentChars);
  const runDir = createRunDir(path.join(__dirname, "../../outputs"));

  const plan = {
    channel,
    title,
    pov,
    styleKey,
    targetScriptChars: target,
    segmentChars,
    chapterCount,
    imagesPerChapter: reg.imagesPerChapter,
    avatarRequired: reg.avatarRequired,
    promptPath: reg.promptPath,
    imageSize: reg.imageSize,
    runDir,
    createdAt: new Date().toISOString(),
  };

  write(path.join(runDir, "plan.json"), JSON.stringify(plan, null, 2));

  return plan;
}

module.exports = { buildPlan };
