// Persist service worker with heartbeat every 20 seconds
window.setInterval(
  async () => await chrome.runtime.sendMessage({ keepAlive: true }),
  20000
);
