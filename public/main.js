document.getElementById("genForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const log = (msg) => {
    document.getElementById("log").textContent += msg + "\n";
  };

  document.getElementById("log").textContent = "";
  const form = new FormData(e.target);
  const title = form.get("title").trim();
  const mood = form.get("mood").trim();

  try {
    // 1) Outline
    log("➡️  Generating outline …");
    const outlineRes = await fetch("/api/outline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, mood }),
    }).then((r) => r.json());

    if (!outlineRes.runDir) throw new Error("outline API failed");
    log("✅ Outline ready — runDir: " + outlineRes.runDir);

    // 2) Script
    log("➡️  Generating script … (this takes several minutes)");
    await fetch("/api/script", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        runDir: outlineRes.runDir,
        title,
      }),
    }).then((r) => r.json());
    log("✅ Script done.");

    // 3) Images
    log("➡️  Generating images … (also slow)");
    await fetch("/api/images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        outlinePath: `${outlineRes.runDir}/outline.txt`,
        styleKey: "tapestry",
      }),
    }).then((r) => r.json());
    log("🎉 All assets generated — check outputs folder.");
  } catch (err) {
    console.error(err);
    log("❌ " + err.message);
  }
});
