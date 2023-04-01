const fs = require("fs-extra");

fs.copy("./chrome", "./firefox", function (error) {
  if (error) {
    return console.error(error);
  }
  updateManifest();
});

async function updateManifest () {
  try {
    const extensionManifest = await fs.readJson("./firefox/manifest.json");

    extensionManifest.background.scripts = ["background.js"];
    delete extensionManifest.background.service_worker;

    extensionManifest.browser_specific_settings = {
      gecko: {
        id: "kanotifications@eliasmurcray.com"
      }
    };

    await fs.writeJson("./firefox/manifest.json", extensionManifest, { spaces: 2 });
  } catch (error) {
    console.error(error);
  }
}
