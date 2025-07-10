// src/config/env.js
require("dotenv").config();
const joi = require("joi");

/** ──────────────── schema ──────────────── */
const schema = joi
  .object({
    NODE_ENV: joi
      .string()
      .valid("development", "production")
      .default("development"),
    PORT: joi.number().integer().default(3000),

    /* model-agnostic */
    IMAGES_PER_CHAPTER: joi.number().integer().default(3),
    CHAPTER_COUNT: joi.number().integer().default(15),
    SCRIPT_CHAPTER_COUNT: joi.number().integer().default(10),
    LLM_PROVIDER: joi.string().valid("openai", "gemini").default("openai"),

    /* OpenAI */
    OPENAI_API_KEY: joi
      .string()
      .allow("")
      .when("LLM_PROVIDER", {
        is: "openai",
        then: joi.string().min(10).required().messages({
          "any.required": "OPENAI_API_KEY is required when LLM_PROVIDER=openai",
        }),
      }),

    /* Gemini etc. (placeholder) */
    GEMINI_API_KEY: joi.string().allow(""),
  })
  .unknown(true); // leave room for odd CI vars

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
  ...env, // raw vals
  isDev: env.NODE_ENV === "development",
  isProd: env.NODE_ENV === "production",
};