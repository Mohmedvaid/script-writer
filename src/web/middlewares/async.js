// src/web/middlewares/async.js
module.exports = (handler) =>
  function wrapped(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
