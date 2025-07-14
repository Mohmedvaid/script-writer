const express = require("express");
const z = require("zod");
const asyncMW = require("../middlewares/async");
const { generateOutline } = require("../../core/outline.service");

const router = express.Router();

const BodySchema = z.object({
  title: z.string().trim().min(5),
  mood: z.string().trim().optional(),
  pov: z.enum(["second_person", "first_person"]).optional(),
  channel: z.string().trim().min(1),
  styleKey: z.string().trim().min(1).optional(),
});

router.post(
  "/outline",
  asyncMW(async (req, res) => {
    const parse = BodySchema.safeParse(req.body);
    if (!parse.success)
      return res.status(400).json({ error: parse.error.issues[0].message });

    const { title, mood, pov, channel } = parse.data;
    const { outline, runDir } = await generateOutline({ title, mood, pov, channel });

    res.json({ runDir, outline });
  })
);

module.exports = router;
