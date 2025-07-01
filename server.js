// server.js
require("dotenv").config();
const { validateEnv } = require("./config/env");
validateEnv();

const express = require("express");
const path = require("path");
const morgan = require("morgan");
const generateRoutes = require("./routes/generate");
const app = express();

// ✅ Check for required env var
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY is not set in the environment variables.");
  process.exit(1);
}

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.json());
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.get("/", (req, res) => {
  res.render("index", { title: "", outline: "" });
});
app.use("/generate", generateRoutes);

// global error handler
app.use((err, req, res, next) => {
  console.error("❌ Uncaught error:", err.stack || err.message || err);
  res.status(500).send("Internal server error.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);
