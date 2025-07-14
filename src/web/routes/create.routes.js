// src/web/routes/create.routes.js
const express = require("express");
const z = require("zod");
const asyncMW = require("../middlewares/async");

const { buildPlan } = require("../../core/runPlan.service");
const { generateOutline } = require("../../core/outline.service");
// const { writeFullScript } = require("../../core/script.service");
// const { generateImages }  = require("../../core/image.service");

const router = express.Router();

/* ── body validation ── */
const BodySchema = z.object({
  title: z.string().trim().min(5),
  channel: z.string().trim().min(1),
  styleKey: z.string().trim().min(1),
  pov: z.string().trim().min(1)
});

router.post(
  "/create",
  asyncMW(async (req, res) => {
    /* 1️⃣ validate body */
    const parsed = BodySchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.issues[0].message });

    /* 2️⃣ build plan.json + runDir (throws if invalid) */
    console.log("Generating plan for:", parsed.data);
    const { runDir, plan } = buildPlan(parsed.data);
    console.log("Plan created:", plan);

    /* 3️⃣ outline */
    console.log("Generating outline...");
    await generateOutline({ ...plan, runDir });
    console.log("Outline generated and saved.");

    /* 4️⃣ script */
    // const scriptInfo = await writeFullScript(runDir);

    /* 5️⃣ images */
    // const imagesInfo = await generateImages(runDir); // reads plan.json internally

    /* 6️⃣ done – respond */
    res.json({
      status: "complete",
      runDir,
      outlineFile: "outline.txt",
      // scriptFile: scriptInfo.scriptFile,
      // charsWritten: scriptInfo.charsWritten,
      // segments: scriptInfo.segments,
      // imagesDir: imagesInfo.imagesDir,
      // imagesGenerated: imagesInfo.imagesGenerated,
      plan,
    });
  })
);

module.exports = router;
