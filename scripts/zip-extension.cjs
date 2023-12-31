const fs = require("fs");
const path = require("path");
const archiver = require("archiver");

function createExtensionZip() {
  // Read the version number from manifest.json
  const manifestPath = path.join(__dirname, "..", "src", "manifest.json");
  const manifestData = fs.readFileSync(manifestPath, "utf8");
  const version = JSON.parse(manifestData).version;

  // Create the zip files
  const outputDir = path.join(__dirname, "..", "zip");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const chromeZipName = `c-ka-notifications-${version}.zip`;

  // Create the chrome zip
  const chromeOutputPath = path.join(outputDir, chromeZipName);
  const chromeArchive = archiver("zip");
  const chromeZipStream = fs.createWriteStream(chromeOutputPath);
  chromeZipStream.on("close", function () {
    console.log(`${chromeZipName} has been created successfully.`);
  });
  chromeArchive.pipe(chromeZipStream);
  chromeArchive.directory(path.join(__dirname, "..", "chrome"), false);
  chromeArchive.finalize();
}

createExtensionZip();
