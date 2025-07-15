// src/app.js
const express = require("express");
const morgan = require("morgan");
const path = require("path");

const cfg = require("./config/env");
const loggerMW = require("./web/middlewares/logger");
const errorMW = require("./web/middlewares/error");
const asyncMW = require("./web/middlewares/async");

const configRoutes = require("./web/routes/config.routes");
const createRoutes = require("./web/routes/create.routes");

// ── create app
const app = express();
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (cfg.isDev) app.use(morgan("dev"));

// static files (optional public dir)
app.use(express.static(path.join(__dirname, "..", "public")));

/* ─────────── ROUTES (to be filled in Phase 7) ─────────── */
// const outlineRoutes = require("./web/routes/outline.routes");
// app.use("/outline", outlineRoutes);

app.get("/", (_req, res) => res.render("index", { title: "" }));

//TODO:  not sure if this right spot for this
// app.use("/api", outlineRoutes);
// app.use("/api", scriptRoutes);
// app.use("/api", imageRoutes);
app.use("/api", configRoutes);
app.use("/api", createRoutes);

// ── last: error handler
app.use(errorMW);

module.exports = app;
