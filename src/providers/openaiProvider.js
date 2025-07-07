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

  /** image({ prompt, size, quality, n, model }) → [Buffer] or [url] */
  async image(opts) {
    const {
      model,
      prompt,
      size = "1024x1024",
      quality = "auto",
      n = 1,
    } = opts;

    const res = await this.client.images.generate({
      model,
      prompt,
      size,
      quality,
      n,
    });

    // gpt-image-1 → base64 buffers
    if (model === "gpt-image-1") {
      return res.data
        .map((d) => {
          if (!d.b64_json) return null;
          return Buffer.from(d.b64_json, "base64");
        })
        .filter(Boolean);
    }

    // default → image URLs
    return res.data.map((d) => d.url).filter(Boolean);
  }
}

module.exports = OpenAIProvider;
