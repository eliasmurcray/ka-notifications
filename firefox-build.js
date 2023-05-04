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

    extensionManifest.permissions.pop();

    await fs.writeJson("./firefox/manifest.json", extensionManifest, { spaces: 2 });

    const backgroundContent = fs.readFileSync('./firefox/background.js', 'utf-8');
    fs.writeFileSync('./firefox/background.js', backgroundContent.replace('async function y(){await(chrome.offscreen.hasDocument?.())||await chrome.offscreen.createDocument({url:chrome.runtime.getURL("heartbeat.html"),reasons:[chrome.offscreen.Reason.BLOBS],justification:"keep service worker running"})}chrome.runtime.onStartup.addListener((()=>{y()})),chrome.runtime.onInstalled.addListener((()=>{y()})),chrome.runtime.onMessage.addListener((e=>{e.keepAlive})),', ''), 'utf-8');
  } catch (error) {
    console.error(error);
  }
}
