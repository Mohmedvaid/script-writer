// src/utils/fsHelpers.js
/**
 * Extract exactly `count` chapter blocks from an outline.
 * Throws if fewer found.
 */
function extractChapters(outline, count) {
  const matches = [
    ...outline.matchAll(
      /^CHAPTER\\s+\\d+\\s+–[\\s\\S]+?(?=^CHAPTER\\s+\\d+\\s+–|$)/gm
    ),
  ];
  if (matches.length < count) {
    throw new Error(
      `Expected ${count} chapters but found ${matches.length}. Check outline format.`
    );
  }
  return matches.slice(0, count).map((m) => m[0].trim());
}

module.exports = { extractChapters };
