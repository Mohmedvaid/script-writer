// src/config/channelRegistry.js
const fs = require("fs");
const path = require("path");

const registry = {
  boring_history: {
    label: "Boring History for Sleep",
    avatarRequired: true,
    promptPath: "boring_history",
    styles: ["tapestry", "etching"],
    povOptions: ["second_person", "first_person"],
    targetScriptChars: 20_000,
    // segmentChars: 12_000,
    imagesPerChapter: 2,
    imageSize: "1536x1024",
  },
  bible_channel: {
    label: "Biblical Prophecies",
    avatarRequired: true,
    promptPath: "bible_channel",
    styles: ["bible"],
    povOptions: ["third_person", "first_person"],
    targetScriptChars: 15_000,
    imagesPerChapter: 10,
    imageSize: "1536x1024",
  },
};

/* ── integrity checks (throw on startup) ── */
Object.entries(registry).forEach(([key, cfg]) => {
  [
    "promptPath",
    "styles",
    "povOptions",
    "targetScriptChars",
    "imagesPerChapter",
  ].forEach((f) => {
    if (cfg[f] === undefined) throw new Error(`Channel ${key}: missing ${f}`);
  });
  const folder = path.join(__dirname, "..", "prompts", cfg.promptPath);
  if (!fs.existsSync(folder))
    throw new Error(`Channel ${key}: promptPath not found → ${folder}`);
});

module.exports = registry;
