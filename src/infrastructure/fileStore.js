// src/infrastructure/fileStore.js
const fs = require("fs");
const path = require("path");

/**
 * createRunDir("/outputs", "outline") ➜ /outputs/2025-07-01T18-22-11-123Z
 */
function createRunDir(baseDir) {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const full = path.join(baseDir, ts);
  fs.mkdirSync(full, { recursive: true });
  return full;
}

/** ensure a directory exists (no throw if already) */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/** write text and log */
function write(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, data);
  console.log("📝 wrote", filePath);
}

module.exports = { createRunDir, ensureDir, write };
