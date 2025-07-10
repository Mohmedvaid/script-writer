document.getElementById("genForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const log = (m) =>
    (document.getElementById("log").textContent += m + "\n");
  document.getElementById("log").textContent = "";

  const fd   = new FormData(e.target);
  const body = {
    title: fd.get("title")?.trim(),
    mood:  fd.get("mood")?.trim() || undefined,   // blank → undefined
    pov:   fd.get("pov"),                         // select defaults to second_person
  };
  const styleKey = fd.get("styleKey") || "tapestry";

  try {
    /* 1 ── OUTLINE */
    log("➡️  Generating outline …");
    const outlineRes = await fetch("/api/outline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => r.json());
    if (!outlineRes.runDir)
      throw new Error(outlineRes.error || "outline API failed");
    log("✅ Outline ready — runDir: " + outlineRes.runDir);

    /* 2 ── SCRIPT */
    log("➡️  Generating script … (a few minutes)");
    const scriptRes = await fetch("/api/script", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        runDir: outlineRes.runDir,
        title:  body.title,
      }),
    }).then((r) => r.json());
    if (!scriptRes.scriptPath)
      throw new Error(scriptRes.error || "script API failed");
    log("✅ Script done.");

    /* 3 ── IMAGES */
    log("➡️  Generating images … (also slow)");
    const imgRes = await fetch("/api/images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        outlinePath: `${outlineRes.runDir}/outline.txt`,
        styleKey,
      }),
    }).then((r) => r.json());
    if (!imgRes.ok && imgRes.error)
      throw new Error(imgRes.error || "images API failed");
    log("🎉 All assets generated — check outputs folder.");
  } catch (err) {
    console.error(err);
    log("❌ " + err.message);
  }
});
