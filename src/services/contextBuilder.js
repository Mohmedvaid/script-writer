const z = require("zod");
const llm = require("../config/llm");

// ── 1. schema ----------------------------------------------------------------
const MoodEnum = z.enum([
  "serene", "melancholy", "playful", "foreboding",
  // … add/adjust as you like …
]);

const POVEnum  = z.enum(["first_person", "second_person", "third_person"]);

const InputSchema = z.object({
  title:   z.string().trim().min(5, "Video title too short."),
  mood:    MoodEnum.optional(),
  pov:     POVEnum.default("second_person"),
});

// ── 2. detect setting --------------------------------------------------------
async function detectSetting(title) {
  const sys = "Return the implied historical setting in ≤ 5 words.";
  const content = await llm.chat({
    model: process.env.SETTING_MODEL || "gpt-4o-mini",
    temperature: 0,
    messages: [
      { role: "system", content: sys },
      { role: "user",   content: `Title: "${title}"\nSETTING:` },
    ],
  });
  
  if (!content?.trim()) throw new Error("Could not detect setting.");
  return content.trim();
}

// ── 3. public helper ---------------------------------------------------------
/**
 * Validate inputs and enrich with SETTING string.
 * @param {{ title:string, mood?:string, pov?:string }} params
 * @returns {Promise<{ title:string, mood:string, pov:string, setting:string }>}
 */
async function buildContext(params) {
  const { title, mood = "you pick", pov } = InputSchema.parse(params);
  const setting = await detectSetting(title);
  return { title, mood, pov, setting };
}

module.exports = { buildContext };
