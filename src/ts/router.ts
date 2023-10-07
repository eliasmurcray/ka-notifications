const split = window.location.pathname.split("/");

if (
  (split[1] === "computer-programming" || split[1] === "cs") &&
  /^\d{16}$/.test(split[3].split("?")[0])
) {
  const projectScript = document.createElement("script");
  projectScript.src = chrome.runtime.getURL("project.js");
  document.head.append(projectScript);

  /**
   * Auto sort comments
   */

  chrome.storage.local.get("commentSort", keys => {
    if (keys.commentSort === undefined) {
      return;
    }
    updateSortBy(keys.commentSort as string, 0);
  });
} else if (
  (split[2] === "computer-programming" || split[2] === "cs") &&
  split[3] === "browse"
) {
  const hotlistScript = document.createElement("script");
  hotlistScript.src = chrome.runtime.getURL("hotlist.js");
  document.head.append(hotlistScript);
}

/**
 * Attempts to "automatically" sort the comments correctly by user preference (it spams buttons)
 * @param sortBy Type of trend to sort by
 * @param iteration Makes sure not to spam click too many times
 */

function updateSortBy(sortBy: string, iteration: number) {
  if (iteration > 10000) {
    console.log("Iteration over 10000, breaking updateSortBy");
    return;
  }
  const button = document.querySelector<HTMLButtonElement>("button#sortBy");
  button?.click();

  const element = document.querySelector(
    'div[data-test-id="dropdown-core-container"]'
  );
  if (element === null) {
    requestAnimationFrame(() => {
      updateSortBy(sortBy, iteration + 1);
    });
    return;
  }

  const listBox = element.firstElementChild;
  const children = Array.from(listBox.children);
  const userPreference = children[
    ["Trending", "Top Voted", "Recent"].indexOf(sortBy)
  ] as HTMLDivElement;
  userPreference.click();

  const interval = setInterval(() => {
    button.click();

    if (button.getAttribute("aria-expanded") === "false") {
      clearInterval(interval);
    }
  }, 1);
}
