// src/infrastructure/promptLoader.js
const fs = require("fs");
const path = require("path");
const cfg = require("../config/env");

const cache = new Map();

/**
 * load("outline")  ->  returns string of /prompts/outline.txt
 * loadStyle("tapestry") -> /prompts/image_styles/tapestry.txt
 */
function load(name) {
  if (cache.has(name)) return cache.get(name);

  const baseDir = path.join(__dirname, "..", "prompts");
  const full = path.join(baseDir, name.includes("/") ? name : `${name}.txt`);

  if (!fs.existsSync(full))
    throw new Error(`🧐 Missing prompt template: ${full}`);

  const txt = fs.readFileSync(full, "utf-8");
  cache.set(name, txt);
  return txt;
}

function loadStyle(key = "default") {
  return load(`image_styles/${key}.txt`);
}

function loadRaw(absOrRel) {
  const baseDir = path.join(__dirname, "..", "prompts");
  const full    = path.isAbsolute(absOrRel)
    ? absOrRel
    : path.join(baseDir, absOrRel);

  if (!fs.existsSync(full))
    throw new Error(`🧐 Missing prompt template: ${full}`);

  if (cache.has(full)) return cache.get(full);
  const txt = fs.readFileSync(full, "utf-8");
  cache.set(full, txt);
  return txt;
}

module.exports = { load, loadStyle, loadRaw };
