// src/web/routes/create.routes.js
const express = require("express");
const z = require("zod");
const asyncMW = require("../middlewares/async");

const { buildPlan } = require("../../core/planBuilder.service");
const { generateOutline } = require("../../core/outline.service");
const { writeFullScript } = require("../../core/script.service");
const { generateImages } = require("../../core/image.service");

const router = express.Router();

/* ── body validation ── */
const BodySchema = z.object({
  title: z.string().trim().min(5),
  channel: z.string().trim().min(1),
  styleKey: z.string().trim().min(1),
  pov: z.string().trim().min(1),
});

router.post(
  "/create",
  asyncMW(async (req, res) => {
    /* 1️⃣ validate body */
    const parsed = BodySchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.issues[0].message });

    console.log("Generating plan...");
    const plan = buildPlan(parsed.data);
    const runDir = plan.runDir;

    console.log("Plan built successfully:", plan);

    console.log("Generating outline...");
    await generateOutline(plan);

    console.log("Writing full script...");
    const scriptInfo = await writeFullScript(runDir);

    console.log("Generating images...");
    const imagesInfo = await generateImages(plan);

    console.log("All tasks completed successfully!");
    return res.json({
      status: "complete",
      runDir,
      outlineFile: "outline.txt",
      scriptFile: scriptInfo.scriptFile,
      charsWritten: scriptInfo.charsWritten,
      segments: scriptInfo.segments,
      imagesDir: imagesInfo.imagesDir,
      imagesGenerated: imagesInfo.imagesGenerated,
      plan,
    });
  })
);

module.exports = router;
