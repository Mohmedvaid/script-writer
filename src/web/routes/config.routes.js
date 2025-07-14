// routes/config.routes.js
const express = require("express");
const router = express.Router();
const channelRegistry = require("../../config/channelRegistry");

router.get("/config", (req, res) => {
  const channels = Object.entries(channelRegistry).map(([key, cfg]) => ({
    key,
    label: cfg.label,
    styles: cfg.styles,
    povOptions: cfg.povOptions,
    avatarRequired: cfg.avatarRequired,
  }));
  res.json({ channels });
});

module.exports = router;
