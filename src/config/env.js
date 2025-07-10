// src/config/env.js
require("dotenv").config();
const joi = require("joi");

/** ──────────────── schema ──────────────── */
const schema = joi
  .object({
    // ── runtime ──
    NODE_ENV: joi
      .string()
      .valid("development", "production")
      .required(),

    PORT: joi.number().integer().required(),

    // ── provider & auth ──
    LLM_PROVIDER: joi.string().valid("openai", "gemini").required(),

    OPENAI_API_KEY: joi
      .string()
      .min(10)
      .when("LLM_PROVIDER", {
        is: "openai",
        then: joi.required().messages({
          "any.required": "OPENAI_API_KEY is required when LLM_PROVIDER=openai",
        }),
      }),

    GEMINI_API_KEY: joi
      .string()
      .allow("")
      .when("LLM_PROVIDER", { is: "gemini", then: joi.required() }),

    // ── model choices ──
    OUTLINE_MODEL: joi.string().required(),
    SETTING_MODEL: joi.string().required(),
    SCRIPT_MODEL: joi.string().required(),
    SCRIPT_MAX_TOKENS: joi.number().integer().min(500).required(),

    IMAGE_MODEL: joi.string().required(),
    IMAGE_TEXT_MODEL: joi.string().required(),
    IMAGE_QUALITY: joi.string().valid("low", "standard", "hd", "auto").required(),
    IMAGE_SIZE: joi.string().valid("landscape", "square", "portrait").required(),

    // ── generation counts ──
    IMAGES_PER_CHAPTER: joi.number().integer().min(1).required(),
    CHAPTER_COUNT: joi.number().integer().min(1).required(),
    SCRIPT_CHAPTER_COUNT: joi.number().integer().min(1).required(),
  })
  .unknown(true); // allow extra vars for CI or deployment tools

/** ──────────────── parse ──────────────── */
const { value: env, error } = schema.validate(process.env, {
  abortEarly: false,
  convert: true,
});

if (error) {
  console.error("❌ ENV VALIDATION ERRORS:");
  error.details.forEach((d) => console.error(`• ${d.message}`));
  process.exit(1);
}

/** exposed config object  */
module.exports = {
  ...env,
  isDev: env.NODE_ENV === "development",
  isProd: env.NODE_ENV === "production",
};
