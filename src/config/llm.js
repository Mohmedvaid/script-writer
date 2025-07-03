// src/config/llm.js
const cfg = require("./env");
const OpenAI = require("../providers/openaiProvider");
const Gemini = require("../providers/geminiProvider"); // placeholder

let client;

switch (cfg.LLM_PROVIDER) {
  case "gemini":
    client = new Gemini(cfg);
    break;
  case "openai":
  default:
    client = new OpenAI(cfg);
    break;
}

module.exports = client; // exported as a **singleton**
