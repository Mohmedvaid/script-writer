// src/providers/openaiProvider.js
const { OpenAI } = require("openai");

class OpenAIProvider {
  constructor(cfg) {
    this.client = new OpenAI({ apiKey: cfg.OPENAI_API_KEY });
  }

  /** chat({ model, messages, ... }) → string */
  async chat(opts) {
    const res = await this.client.chat.completions.create(opts);
    return res.choices?.[0]?.message?.content?.trim() || "";
  }

  /** image({ prompt, size, n, model }) → [url] */
  async image(opts) {
    const res = await this.client.images.generate(opts);
    return res.data?.map((d) => d.url) || [];
  }
}

module.exports = OpenAIProvider;
