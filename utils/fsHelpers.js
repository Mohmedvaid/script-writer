const fs = require("fs");
const path = require("path");

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

function loadTemplate(templateName) {
  const promptsDir = path.join(__dirname, "../prompts");
  const fullPath = path.join(promptsDir, templateName);
  if (!fs.existsSync(fullPath))
    throw new Error(`Missing prompt file: ${templateName}`);
  return fs.readFileSync(fullPath, "utf-8");
}

function interpolate(template, values) {
  return template.replace(/{{(.*?)}}/g, (_, key) => values[key.trim()] ?? "");
}

function extractChapters(outline, count) {
  const matches = [
    ...outline.matchAll(/^CHAPTER\s+\d+\s+–[\s\S]+?(?=^CHAPTER\s+\d+\s+–|$)/gm),
  ];
  if (matches.length < count) {
    throw new Error(`Expected ${count} chapters but found ${matches.length}`);
  }
  return matches.slice(0, count).map((m) => m[0].trim());
}

module.exports = {
  ensureDir,
  loadTemplate,
  interpolate,
  extractChapters,
};
