const fs = require("fs-extra");

// Clone Chrome dir into Firefox dir
fs.remove("./firefox", (error) => {
  if (error) {
    return console.error(error);
  }

  // Copy files from "Chrome" directory to "Firefox" directory
  fs.copy("./chrome", "./firefox", (error) => {
    if (error) {
      return console.error(error);
    }

    updateManifest();
  });
});

// Update the manifest.json file in the cloned Firefox dir
async function updateManifest() {
  try {
    const extensionManifest = await fs.readJson("./firefox/manifest.json");

    extensionManifest.background.scripts = ["background.js"];
    delete extensionManifest.background.service_worker;
    delete extensionManifest.background.type;

    extensionManifest.browser_specific_settings = {
      gecko: {
        id: "kanotifications@eliasmurcray.com",
      },
    };

    extensionManifest.permissions.pop();
    extensionManifest.host_permissions[0] = "*://www.khanacademy.org/*";

    await fs.writeJson("./firefox/manifest.json", extensionManifest, {
      spaces: 2,
    });

    console.log("Firefox package has been built successfully.");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
