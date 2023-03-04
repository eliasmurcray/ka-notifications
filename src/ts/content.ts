const { search, pathname } = window.location;
const split = pathname.split("/");
const isProject = (split[1] === "computer-programming" || split[1] === "cs") && /^\d{16}$/.test(split[3].split("?")[0]);
const params = new URLSearchParams(search);

if(isProject) main();

function main() {
  console.clear();
  console.log("Hello from KA Notifications Extension!");

  const replyScript = document.createElement("script");
  replyScript.src = chrome.runtime.getURL("reply.js");
  document.head.append(replyScript);
}