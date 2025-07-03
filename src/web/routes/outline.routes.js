// src/web/routes/outline.routes.js
const express = require("express");
const asyncMW = require("../middlewares/async");
const { generateOutline } = require("../../core/outline.service");

const router = express.Router();

router.post(
  "/outline",
  asyncMW(async (req, res) => {
    const { title } = req.body;
    if (!title?.trim())
      return res.status(400).json({ error: "title required" });

    const { outline, runDir } = await generateOutline(title.trim());
    res.json({ runDir, outline });
  })
);

module.exports = router;

// ───────────────────────────────────────
// src/web/routes/script.routes.js
const express2 = require("express");
const asyncMW2 = require("../middlewares/async");
const { ScriptWriterSession } = require("../../core/script.service");
const path = require("path");
const fs = require("fs");

const router2 = express2.Router();

router2.post(
  "/script",
  asyncMW2(async (req, res) => {
    const { runDir } = req.body;
    if (!runDir || !fs.existsSync(path.join(runDir, "outline.txt"))) {
      return res.status(400).json({ error: "invalid runDir" });
    }

    const outline = fs.readFileSync(path.join(runDir, "outline.txt"), "utf-8");
    const writer = new ScriptWriterSession(outline, runDir);

    const chapters = [];
    for (let i = 0; i < 15; i++) {
      chapters.push(await writer.generateNext());
    }

    res.json({ chaptersWritten: chapters.length, runDir });
  })
);

module.exports = router2;

// ───────────────────────────────────────
// src/web/routes/image.routes.js
const express3 = require("express");
const asyncMW3 = require("../middlewares/async");
const { generateImages } = require("../../core/image.service");
const path3 = require("path");
const fs3 = require("fs");

const router3 = express3.Router();

router3.post(
  "/images",
  asyncMW3(async (req, res) => {
    const { outlinePath, styleKey } = req.body;
    if (!outlinePath || !fs3.existsSync(outlinePath)) {
      return res.status(400).json({ error: "outlinePath missing or invalid" });
    }

    await generateImages(path3.resolve(outlinePath), styleKey || "default");
    res.json({ status: "images generated", style: styleKey || "default" });
  })
);

module.exports = router3;

// ───────────────────────────────────────
// PATCH for src/app.js (add after other middlewares)
/*
const outlineRoutes = require("./web/routes/outline.routes");
const scriptRoutes  = require("./web/routes/script.routes");
const imageRoutes   = require("./web/routes/image.routes");

app.use("/api", outlineRoutes);
app.use("/api", scriptRoutes);
app.use("/api", imageRoutes);
*/
