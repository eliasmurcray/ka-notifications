const split = window.location.pathname.split("/");

if ((split[1] === "computer-programming" || split[1] === "cs") && /^\d{16}$/.test(split[3].split("?")[0])) {
  const projectScript = document.createElement("script");
  projectScript.src = chrome.runtime.getURL("project.js");
  document.head.append(projectScript);
}
