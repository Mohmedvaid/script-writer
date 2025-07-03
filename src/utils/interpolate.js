// src/utils/interpolate.js
/**
 * Simple {{PLACEHOLDER}} interpolation.
 *   interpolate("Hi {{NAME}}", { NAME: "Alice" })
 */
module.exports = function interpolate(template, values = {}) {
  return template.replace(/{{(.*?)}}/g, (_, key) => values[key.trim()] ?? "");
};
