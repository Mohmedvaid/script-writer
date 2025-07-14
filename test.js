const fs = require("fs");
const path = require("path");
const { buildVideoFromImages } = require("./src/services/videoBuilder");

(async () => {
  const imgDir = path.resolve(__dirname, "outputs/2025-07-10T20-38-44-379Z/images/all");
  const output = path.resolve(__dirname, "test.mp4"); // keep it flat for test
  const durations = [4, 4, 5, 5, 10, 10, 10, 20];
  const fallback = 5;

  try {
    await buildVideoFromImages(imgDir, durations, fallback, output);
    console.log("✅ Video created:", output);
  } catch (err) {
    console.error("❌ Failed to create video:", err.message);
  }
})();
