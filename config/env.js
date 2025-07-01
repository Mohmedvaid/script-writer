// config/env.js
const fs = require("fs");
const path = require("path");

const PROMPT_DIR = path.join(__dirname, "../prompts");
const REQUIRED_PROMPTS = ["outline.txt", "script.txt"];

const ENV_VARS = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OUTLINE_MODEL: process.env.OUTLINE_MODEL || "gpt-4.1",
  PROMPT_DIR,
  OUTLINE_PATH: path.join(PROMPT_DIR, "outline.txt"),
  SCRIPT_PATH: path.join(PROMPT_DIR, "script.txt"),
  NODE_ENV: process.env.NODE_ENV || "development",
};

function validateEnv() {
  if (!ENV_VARS.OPENAI_API_KEY) {
    console.error("❌ Missing OPENAI_API_KEY in .env");
    process.exit(1);
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
