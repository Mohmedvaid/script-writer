// src/core/script.service.js

const fs = require("fs");
const path = require("path");

const cfg = require("../config/env");
const llm = require("../config/llm");
const prompts = require("../infrastructure/promptLoader");
const { ensureDir, write } = require("../infrastructure/fileStore");
const interpolate = require("../utils/interpolate");

class SegmentedScriptWriter {
  /**
   * @param {string} outlineText
   * @param {string} runDir         Job directory with plan.json
   * @param {object} plan           Parsed plan.json
   * @param {object} [opts]         { title?: string }
   */
  constructor(outlineText, runDir, plan, opts = {}) {
    if (!outlineText) throw new Error("Outline text is required.");
    if (!runDir) throw new Error("runDir is required.");
    if (!plan) throw new Error("plan.json data missing.");
    if (!plan.title) throw new Error("Plan must have a title.");
    if (!plan.segmentChars) throw new Error("Plan must have segmentChars.");

    this.plan = plan;
    this.runDir = runDir;
    this.scriptDir = path.join(runDir, "script");
    this.segmentIdx = 1;
    this.charCount = 0;
    this.chapterCount = plan.chapterCount;

    ensureDir(this.scriptDir);

    /* Load channel-specific prompt */
    const scriptTpl = prompts.loadRaw(
      path.join(__dirname, "..", "prompts", plan.promptPath, "script.txt")
    );

    const systemPrompt = interpolate(scriptTpl, {
      OUTLINE: outlineText.trim(),
      TITLE: opts.title || plan.title,
      SEGMENT_CHARS: plan.segmentChars,
    });

    this.history = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: "Begin the story. Keep flowing; no hard breaks.",
      },
    ];
  }

  /** Generate one segment, persist, update counters */
  async generateNext() {
    if (this.segmentIdx > this.chapterCount)
      throw new Error("All segments generated (cap reached).");

    const modelName = cfg.SCRIPT_MODEL;
    if (!modelName)
      throw new Error("No model configured for script generation.");

    console.log(
      `✍️  Segment ${this.segmentIdx} (${this.charCount} chars so far)`
    );

    const response = await llm.chat({
      model: modelName,
      temperature: 0.8,
      top_p: 0.95,
      max_tokens: cfg.SCRIPT_MAX_TOKENS,
      messages: this.history,
    });

    if (!response) throw new Error("Empty response from LLM.");

    const terminator = `--END OF PART ${this.segmentIdx}--`;
    const content = `${response.trim()}\n${terminator}`;

    /* save part */
    const partName = `part-${String(this.segmentIdx).padStart(2, "0")}.txt`;
    const partPath = path.join(this.scriptDir, partName);
    write(partPath, content);

    /* append to master script */
    const masterPath = path.join(this.scriptDir, "full-script.txt");
    fs.appendFileSync(masterPath, content + "\n\n");

    /* update state */
    this.charCount += content.length;
    this.segmentIdx += 1;

    this.history.push({ role: "assistant", content: response });
    this.history.push({ role: "user", content: "Continue seamlessly." });

    return {
      segment: this.segmentIdx - 1,
      totalChars: this.charCount,
    };
  }

  done() {
    return this.segmentIdx > this.chapterCount;
  }
}

/* ────────────────────────────────────────────────────────── *
   Helper – generate the full script for a runDir
* ────────────────────────────────────────────────────────── */
async function writeFullScript(runDir) {
  const planPath = path.join(runDir, "plan.json"); // TODO: should not read the file instead used the passed in plan object
  const outlinePath = path.join(runDir, "outline.txt");

  if (!fs.existsSync(planPath))
    throw new Error(`plan.json not found in ${runDir}`);
  if (!fs.existsSync(outlinePath))
    throw new Error(`outline.txt not found in ${runDir}`);

  const plan = JSON.parse(fs.readFileSync(planPath, "utf-8"));
  const outline = fs.readFileSync(outlinePath, "utf-8");

  const writer = new SegmentedScriptWriter(outline, runDir, plan);
  while (!writer.done()) {
    await writer.generateNext();
  }

  return {
    charsWritten: writer.charCount,
    segments: writer.segmentIdx - 1,
    scriptFile: "script/full-script.txt",
  };
}

module.exports = { writeFullScript, SegmentedScriptWriter };
