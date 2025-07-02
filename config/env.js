// config/env.js
const fs = require("fs");
const path = require("path");

const PROMPT_DIR = path.join(__dirname, "../prompts");
const REQUIRED_PROMPTS = [
  "outline.txt",
  "script.txt",
  "images_only.txt",
];

const ENV_VARS = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OUTLINE_MODEL: process.env.OUTLINE_MODEL || "gpt-4.1",
  PROMPT_DIR,
  OUTLINE_PATH: path.join(PROMPT_DIR, "outline.txt"),
  SCRIPT_PATH: path.join(PROMPT_DIR, "script.txt"),
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 3000,
  IMAGE_MODEL: process.env.IMAGE_MODEL,
  IMAGE_TEXT_MODEL: process.env.IMAGE_TEXT_MODEL,
  IMAGES_PER_CHAPTER: process.env.IMAGES_PER_CHAPTER || 3,
  CHAPTER_COUNT: process.env.CHAPTER_COUNT || 15,
};

function validateEnv() {
  if (!ENV_VARS.OPENAI_API_KEY) {
    console.error("❌ Missing OPENAI_API_KEY in .env");
    process.exit(1);
  }
  if (!ENV_VARS.OUTLINE_MODEL) {
    console.warn("⚠️ OUTLINE_MODEL not set, defaulting to gpt-4.1");
  }
  if (!ENV_VARS.IMAGE_MODEL) {
    console.error("❌ Missing IMAGE_MODEL in .env");
    process.exit(1);
  }
  if (!ENV_VARS.IMAGE_TEXT_MODEL) {
    console.error("❌ Missing IMAGE_TEXT_MODEL in .env");
    process.exit(1);
  }

  if (!ENV_VARS.IMAGES_PER_CHAPTER || isNaN(ENV_VARS.IMAGES_PER_CHAPTER)) {
    console.warn("⚠️ IMAGES_PER_CHAPTER not set or invalid, defaulting to 3");
    ENV_VARS.IMAGES_PER_CHAPTER = 3;
  }
  if (!ENV_VARS.CHAPTER_COUNT || isNaN(ENV_VARS.CHAPTER_COUNT)) {
    console.warn("⚠️ CHAPTER_COUNT not set or invalid, defaulting to 15");
    ENV_VARS.CHAPTER_COUNT = 15;
  }

  const missing = REQUIRED_PROMPTS.filter(
    (file) => !fs.existsSync(path.join(PROMPT_DIR, file))
  );

  if (missing.length) {
    console.error("\n❌ Missing prompt files in /prompts:");
    missing.forEach((f) => console.error(`- ${f}`));
    process.exit(1);
  }

  console.log("✅ Environment loaded successfully.");
}

module.exports = {
  ...ENV_VARS,
  validateEnv,
};
