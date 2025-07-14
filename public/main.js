document.getElementById("genForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const log = (m) => (document.getElementById("log").textContent += m + "\n");
  document.getElementById("log").textContent = "";

  const fd = new FormData(e.target);
  const body = {
    title:   fd.get("title")?.trim(),
    channel: fd.get("channel"),
    styleKey: fd.get("styleKey"),
    pov:     fd.get("pov")
  };

  try {
    log("➡️  Creating run …");
    const res = await fetch("/api/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => r.json());

    if (res.error) throw new Error(res.error);

    log(`✅ Done!  chars: ${res.charsWritten || "n/a"}  images: ${res.imagesGenerated || "n/a"}`);
    log(`📂 Outputs in: ${res.runDir}`);
  } catch (err) {
    console.error(err);
    log("❌ " + err.message);
  }
});
