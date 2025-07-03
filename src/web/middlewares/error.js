// central error handler – minimal version
module.exports = (err, _req, res, _next) => {
  console.error(err.stack || err);
  res.status(500).json({ error: "Internal server error." });
};
