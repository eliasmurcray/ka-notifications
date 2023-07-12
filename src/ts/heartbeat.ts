// Persist service worker with heartbeat every 20 seconds
window.setInterval(() => chrome.runtime.sendMessage({ keepAlive: true }), 20000);
