const fs = require("fs");

function saveText(filePath, content) {
  fs.writeFileSync(filePath, content, "utf-8");
}

module.exports = { saveText };
