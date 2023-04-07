setInterval(() => {
  void chrome.runtime.sendMessage({ keepAlive: true });
}, 20000);
