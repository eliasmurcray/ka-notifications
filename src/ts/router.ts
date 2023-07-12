const split = window.location.pathname.split("/");

if ((split[1] === "computer-programming" || split[1] === "cs") && /^\d{16}$/.test(split[3].split("?")[0])) {
  const projectScript = document.createElement("script");
  projectScript.src = chrome.runtime.getURL("project.js");
  document.head.append(projectScript);
} else if ((split[2] === "computer-programming" || split[2] === "cs") && split[3] === "browse") {
  const hotlistScript = document.createElement("script");
  hotlistScript.src = chrome.runtime.getURL("hotlist.js");
  document.head.append(hotlistScript);
}
