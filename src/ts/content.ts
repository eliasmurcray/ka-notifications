const split = window.location.pathname.split("/");
const isProject = (split[1] === "computer-programming" || split[1] === "cs") && /^\d{16}$/.test(split[3].split("?")[0]);

if(isProject) {
  main();
}

function main () {
  const replyScript = document.createElement("script");
  replyScript.src = chrome.runtime.getURL("reply.js");
  document.head.append(replyScript);

  chrome.storage.local.get('commentSort', (keys) => {
    if(keys.commentSort === undefined) {
      return;
    }
    updateSortBy(keys.commentSort, 0);
  });

  // console.log(localStorage, chrome.storage.local.get('commentSort'));
}

function updateSortBy(sortBy: string, iteration: number) {
  if(iteration > 10000) {
    return console.log("Iteration over 10000, breaking updateSortBy");
  }
  const button = document.querySelector('button#sortBy') as HTMLButtonElement;
  if(button) {
    button.click();
  }
  const element = document.querySelector('div[data-test-id="dropdown-core-container"]') as HTMLDivElement;

  if(element === null) {
    requestAnimationFrame(() => updateSortBy(sortBy, iteration + 1));
    return;
  }

  const listBox = element.firstElementChild;
  const children = Array.from(listBox.children);
  const userPreference = children[["Trending", "Top Voted", "Recent"].indexOf(sortBy)] as HTMLDivElement;
  userPreference.click();
  const newButton = document.querySelector('button#sortBy') as HTMLButtonElement;
  newButton?.click();
}