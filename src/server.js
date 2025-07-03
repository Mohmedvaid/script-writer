// src/server.js
const http = require("http");
const app = require("./app"); // express instance
const cfg = require("./config/env");

const server = http.createServer(app);

server.listen(cfg.PORT, () =>
  console.log(
    `🚀  Server ready on http://localhost:${cfg.PORT} (${cfg.NODE_ENV})`
  )
);
