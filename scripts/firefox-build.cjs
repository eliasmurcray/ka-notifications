const fs = require("fs-extra");

// Clone Chrome dir into Firefox dir
fs.copy("./chrome", "./firefox", function (error) {
  if (error) {
    return console.error(error);
  }
  updateManifest();
});

// Update the manifest.json file in the cloned Firefox dir
async function updateManifest() {
  try {
    const extensionManifest = await fs.readJson("./firefox/manifest.json");

    extensionManifest.background.scripts = ["background.js"];
    delete extensionManifest.background.service_worker;

    extensionManifest.browser_specific_settings = {
      gecko: {
        id: "kanotifications@eliasmurcray.com",
      },
    };

    extensionManifest.permissions.pop();

    await fs.writeJson("./firefox/manifest.json", extensionManifest, {
      spaces: 2,
    });

    console.log("Firefox package has been built successfully.");
  } catch (error) {
    console.error(error);
  }
}
