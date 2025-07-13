// ───────────────────────────────────────
// src/services/videoBuilder.js
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const { ensureDir } = require("../infrastructure/fileStore");

/* ── helpers ─────────────────────────── */
const isWin = process.platform === "win32";
const toFfmpegPath = p => p.replace(/\\/g, "/"); // forward-slash for safety

function assert(condition, msg) {
    if (!condition) throw new Error(msg);
}

/* ── probe ffmpeg binary once at load ── */
let ffmpegChecked = false;
function verifyFfmpegBinary() {
    if (ffmpegChecked) return;
    const bin = process.env.FFMPEG_PATH || "ffmpeg";
    ffmpeg.setFfmpegPath(bin);
    ffmpeg()._getFfmpegPath((err, ffpath) => {
        if (err) {
            throw new Error(
                "FFmpeg not found. Install it and/or set FFMPEG_PATH env var."
            );
        }
        ffmpegChecked = true;
    });
}

/**
 * Create a video slideshow with zoom-out effects
 * @param {string} imageDir       absolute folder path containing .png|.jpg
 * @param {number[]} durationArr  durations (seconds) for first N images
 * @param {number} defaultDur     fallback duration for the rest
 * @param {string} outputPath     desired .mp4 path
 */
async function buildVideoFromImages(
    imageDir,
    durationArr = [],
    defaultDur = 5,
    outputPath
) {
    verifyFfmpegBinary();

    /* ── argument validation ───────────── */
    assert(fs.existsSync(imageDir), `Invalid imageDir: ${imageDir}`);
    assert(path.extname(outputPath).toLowerCase() === ".mp4", "outputPath must end with .mp4");
    assert(defaultDur > 0, "defaultDuration must be > 0");

    ensureDir(path.dirname(outputPath));

    const imageFiles = fs
        .readdirSync(imageDir)
        .filter(f => /\.(png|jpe?g)$/i.test(f))
        .sort();

    assert(imageFiles.length, `No images found in ${imageDir}`);

    /* per-image limit (no image > 60 s) */
    durationArr.forEach((d, i) =>
        assert(d <= 60, `durationArr[${i}] = ${d}s exceeds 60-second per-image cap`)
    );
    assert(defaultDur <= 60, "defaultDuration must be ≤ 60 s");

    /* ── build filter graph ────────────── */
    const filters = [];
    imageFiles.forEach((file, idx) => {
        const dur = durationArr[idx] || defaultDur;
        const zoomSecs = 4; // zoom animation length
        const zoomFrames = 30 * zoomSecs;
        const start = 1.3, end = 1.0;
        const step = (start - end) / zoomFrames;

        filters.push({
            input: toFfmpegPath(path.join(imageDir, file)),
            filter: `[${idx}:v]`
                + `zoompan=z='if(lte(in,${zoomFrames}),${start}-in*${step},${end})'`
                + `:d=1`                                         // ❶ keep 1 frame per input
                + `:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)',fps=30`
                + `,trim=duration=${dur},setpts=PTS-STARTPTS`    // ❷ clip to <dur> s
                + `,scale=1536:1024,setsar=1[v${idx}]`
        });
    });

    /* ── render ────────────────────────── */
    return new Promise((res, rej) => {
        const cmd = ffmpeg();
        filters.forEach(f => cmd.input(f.input).inputOptions([
            "-loop 1", // loop each image
        ]));

        const graph = filters.map(f => f.filter).join(";");
        const concatLabels = filters.map((_, i) => `[v${i}]`).join("");

        cmd
            .complexFilter(`${graph};${concatLabels}concat=n=${filters.length}:v=1:a=0[outv]`, "outv")
            .outputOptions([     // single – good
                "-c:v libx264",
                "-preset veryfast",
                "-pix_fmt yuv420p",
            ])
            .on("start", c => console.log("🎬 FFmpeg:", c))
            .on("error", e => rej(new Error("FFmpeg failed: " + e.message)))
            .on("end", () => res(outputPath))
            .save(toFfmpegPath(outputPath));

    });
}

module.exports = { buildVideoFromImages };
