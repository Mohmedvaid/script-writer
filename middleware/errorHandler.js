module.exports = (err, req, res, next) => {
  console.error("❌ Uncaught error:", err.stack || err.message || err);
  res.status(500).send("Internal server error.");
};
