import { KaNotification } from "../@types/notification";
import { addFeedback, getUserFkeyCookie, graphQLFetchJsonResponse } from "./graphql";
import { cleanse, parseMarkdown } from "./markdown";
import { StringMap } from "../@types/common-types";
import AVATAR_REQUIREMENTS from "../json/avatar-requirements.json";
import AVATAR_SHORTNAMES from "../json/avatar-shortnames.json";
const avatarRequirements: StringMap = AVATAR_REQUIREMENTS;
const avatarShortnames: StringMap = AVATAR_SHORTNAMES;

/**
 * Constructs notification string from input Khan Academy notification object
 *
 * @param notification Khan Academy notification from GraphQL endpoint
 * @returns HTML parseable string to append to popup
 */
export function createNotificationString(notification: KaNotification): string {
  const { brandNew, date, url } = notification;
  switch (notification.__typename) {
    case "ResponseFeedbackNotification":
      return `<li class="notification ${
        brandNew ? "new" : ""
      }"><div class="notification-header"><img class="notification-author-avatar" src="${
        notification.authorAvatarUrl
      }"><h3 class="notification-author-nickname">${cleanse(
        notification.authorNickname,
      )}</h3><a class="hyperlink" href="https://www.khanacademy.org${url}" target="_blank">${
        notification.feedbackType === "REPLY" ? "added a comment" : "answered your question"
      } on ${notification.focusTranslatedTitle}</a><span class="notification-date">${timeSince(
        new Date(date),
      )} ago</span></div><div class="notification-content">${parseMarkdown(
        notification.content,
      )}</div><div class="notification-feedback-container"><button class="notification-feedback-button add-listeners" data-url="${url}" data-typename="ResponseFeedbackNotification" data-feedbacktype="${
        notification.feedbackType
      }">Reply</button></div></li>`;
    case "ProgramFeedbackNotification":
      return `<li class="notification ${
        brandNew ? "new" : ""
      }"><div class="notification-header"><img class="notification-author-avatar" src="${
        notification.authorAvatarSrc
      }"><h3 class="notification-author-nickname">${cleanse(
        notification.authorNickname,
      )}</h3><a class="hyperlink" href="https://www.khanacademy.org${url}" target="_blank">${
        notification.feedbackType === "COMMENT" ? "commented" : "asked a question"
      } on ${cleanse(
        notification.translatedScratchpadTitle,
      )}</a><span class="notification-date">${timeSince(
        new Date(date),
      )} ago</span></div><div class="notification-content">${parseMarkdown(
        notification.content,
      )}</div><div class="notification-feedback-container"><button class="notification-feedback-button add-listeners" data-url="${url}" data-typename="ProgramFeedbackNotification" data-feedbacktype="${
        notification.feedbackType
      }">Reply</button></div></li>`;
    case "AvatarNotification":
      return `<li class="notification ${
        brandNew ? "new" : ""
      }"><div class="notification-header"><img class="notification-author-avatar" src="${
        notification.thumbnailSrc.startsWith("https://cdn.kastatic.org/")
          ? notification.thumbnailSrc
          : "https://cdn.kastatic.org" + notification.thumbnailSrc
      }"><h3 class="notification-author-nickname">KA Avatars</h3><a class="hyperlink" href="https://www.khanacademy.org${url}" target="_blank">use avatar</a><span class="notification-date">${timeSince(
        new Date(date),
      )} ago</span></div><div class="notification-content">You unlocked <b>${
        avatarShortnames[notification.name]
      }</b>! <i>${avatarRequirements[notification.name]}</i></div></li>`;
    case "GroupedBadgeNotification":
      return `<li class="notification ${
        brandNew ? "new" : ""
      }"><div class="notification-header"><img class="notification-author-avatar" src="${
        notification.badgeNotifications[0].badge.icons.compactUrl
      }"><h3 class="notification-author-nickname">KA Badges</h3><a class="hyperlink" href="https://www.khanacademy.org${
        notification.url
      }" target="_blank">view badges</a><span class="notification-date">${timeSince(
        new Date(date),
      )} ago</span></div><p class="notification-content">You earned <b>${
        notification.badgeNotifications[0].badge.description
      }</b> and ${notification.badgeNotifications.length - 1} more! Congratulations!</p></li>`;
    case "BadgeNotification":
      return `<li class="notification ${
        brandNew ? "new" : ""
      }"><div class="notification-header"><img class="notification-author-avatar" src="${
        notification.badge.icons.compactUrl
      }"><h3 class="notification-author-nickname">KA Badges</h3><a class="hyperlink" href="https://www.khanacademy.org/${
        notification.badge.relativeUrl
      }" target="_blank">view badge</a><span class="notification-date">${timeSince(
        new Date(date),
      )}</span></div><div class="notification-content">You earned <b>${
        notification.badge.description
      }</b>! <i>${notification.badge.fullDescription}</i>.</div></li>`;
    default:
      console.log(`Notification type ${notification.__typename} is currently unsupported.`);
      return `<li class="notification ${
        brandNew ? "new" : ""
      }"><div class="notification-header"><img class="notification-author-avatar" src="48.png"><h3 class="notification-author-nickname">Unsupported Notification Type</h3><span class="notification-date">${timeSince(
        new Date(date),
      )} ago</span></div><div class="notification-content">${JSON.stringify(
        notification,
      )}</div></li>`;
  }
}

export function addReplyButtonEventListeners() {
  const replyButtons = document.getElementsByClassName(
    "add-listeners",
  ) as HTMLCollectionOf<HTMLButtonElement>;
  for (let i = replyButtons.length; i--; ) {
    replyButtons[i].addEventListener("click", handleReplyButtonClick);
    replyButtons[i].className = "notification-feedback-button";
  }
}

export function createNoNotificationsString(): string {
  return '<li class="notification new"><div class="notification-header"><img class="notification-author-avatar" src="32.png"><h3 class="notification-author-nickname">KA Notifications</h3></div><div class="notification-content">You have no notifications.</div></li>';
}

export function createNoCookieString(): string {
  return '<li class="notification new"><div class="notification-header"><img class="notification-author-avatar" src="32.png"><h3 class="notification-author-nickname">KA Notifications</h3></div><div class="notification-content">Your authentication cookie has expired. Please <a class="hyperlink" href="https://khanacademy.org/" target="_blank">navigate to Khan Academy</a> to refresh it.</div></li>';
}

export function createLoggedOutString(): string {
  return '<li class="notification new"><div class="notification-header"><img class="notification-author-avatar" src="32.png"><h3 class="notification-author-nickname">KA Notifications</h3></div><div class="notification-content">You are logged out. Please <a class="hyperlink" href="https://khanacademy.org/login" target="_blank">log in to Khan Academy</a> to use this extension.</div></li>';
}

/**
 * Adds event listeners to the user interface.
 *
 * @param theme Optional value to intialize the theme as
 */
export function initUserInterface(theme: string) {
  /**
   * Theme button setup
   */
  const themeButton = document.getElementById("theme-button") as HTMLButtonElement;
  if (theme === "dark") {
    document.body.className = theme;
    themeButton.innerHTML =
      '<svg stroke="#ffffff" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="18px" width="18px" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
  }

  themeButton.onclick = () => {
    const isDark = document.body.className === "dark";
    if (isDark) {
      void chrome.storage.local.remove("theme");
      themeButton.innerHTML =
        '<svg stroke="#ffffff" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="18px" width="18px" xmlns="http://www.w3.org/2000/svg"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
      document.body.className = "";
    } else {
      void chrome.storage.local.set({ theme: "dark" });
      themeButton.innerHTML =
        '<svg stroke="#ffffff" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="18px" width="18px" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
      document.body.className = "dark";
    }
  };

  /**
   * Mark all read setup
   */

  const markAllRead = document.getElementById("mark-all-read") as HTMLButtonElement;
  const markAllReadLoadingSpinner = document.getElementById(
    "mark-all-read-loading",
  ) as HTMLDivElement;

  let markAllReadLoading = false;

  markAllRead.onclick = async () => {
    if (markAllReadLoading) {
      return;
    }
    markAllReadLoading = true;
    markAllReadLoadingSpinner.classList.remove("hidden");
    try {
      const fkey = await getUserFkeyCookie();
      const response = await graphQLFetchJsonResponse("clearBrandNewNotifications", fkey);
      if (response.value) {
        markAllReadLoading = false;
        markAllReadLoadingSpinner.classList.add("hidden");
        void chrome.action.setBadgeText({ text: "" });
      }
    } catch (e) {
      markAllReadLoadingSpinner.classList.add("hidden");
      console.error(e);
    }
  };

  /**
   * Page switching
   */

  const settingsButton = document.getElementById("settings-button") as HTMLButtonElement;
  const notificationsSection = document.getElementById("notifications-section") as HTMLDivElement;
  const settingsSection = document.getElementById("settings-section") as HTMLDivElement;

  settingsButton.onclick = () => {
    notificationsSection.classList.toggle("hidden");
    settingsSection.classList.toggle("hidden");

    if (settingsSection.classList.contains("hidden")) {
      settingsButton.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 96 960 960" width="18"><path fill="#ffffff" d="m388 976-20-126q-19-7-40-19t-37-25l-118 54-93-164 108-79q-2-9-2.5-20.5T185 576q0-9 .5-20.5T188 535L80 456l93-164 118 54q16-13 37-25t40-18l20-127h184l20 126q19 7 40.5 18.5T669 346l118-54 93 164-108 77q2 10 2.5 21.5t.5 21.5q0 10-.5 21t-2.5 21l108 78-93 164-118-54q-16 13-36.5 25.5T592 850l-20 126H388Zm92-270q54 0 92-38t38-92q0-54-38-92t-92-38q-54 0-92 38t-38 92q0 54 38 92t92 38Zm0-60q-29 0-49.5-20.5T410 576q0-29 20.5-49.5T480 506q29 0 49.5 20.5T550 576q0 29-20.5 49.5T480 646Zm0-70Zm-44 340h88l14-112q33-8 62.5-25t53.5-41l106 46 40-72-94-69q4-17 6.5-33.5T715 576q0-17-2-33.5t-7-33.5l94-69-40-72-106 46q-23-26-52-43.5T538 348l-14-112h-88l-14 112q-34 7-63.5 24T306 414l-106-46-40 72 94 69q-4 17-6.5 33.5T245 576q0 17 2.5 33.5T254 643l-94 69 40 72 106-46q24 24 53.5 41t62.5 25l14 112Z"/></svg>';
      settingsButton.title = "Show Settings";
    } else {
      settingsButton.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 96 960 960" width="18"><path fill="#fff" d="M480 896 160 576l320-320 42 42-248 248h526v60H274l248 248-42 42Z"/></svg>';
      settingsButton.title = "Show Notifications";
    }
  };

  const commentSortInput = document.getElementById("sort-comments") as HTMLInputElement;

  (async () => {
    const { commentSort } = await chrome.storage.local.get("commentSort");
    if (commentSort) {
      commentSortInput.value = commentSort;
    } else {
      commentSortInput.value = "Top Voted";
    }
  })();

  commentSortInput.onchange = () => {
    void chrome.storage.local.set({
      commentSort: commentSortInput.value,
    });
  };
}

/**
 * Compares input date with current date and returns a human-readable string representing the difference.
 * @param date The input date to compare.
 * @returns The time difference in a human-readable string.
 */
function timeSince(date: Date): string {
  const seconds = ((new Date().getTime() - date.getTime()) / 1000) | 0;

  if (seconds < 60) {
    return `${seconds} second${seconds === 1 ? "" : "s"}`;
  }

  if (seconds < 3600) {
    const minutes = (seconds / 60) | 0;
    return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  }

  if (seconds < 86400) {
    const hours = (seconds / 3600) | 0;
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }

  if (seconds < 2592000) {
    const days = (seconds / 86400) | 0;
    return `${days} day${days === 1 ? "" : "s"}`;
  }

  if (seconds < 31536000) {
    const months = (seconds / 2592000) | 0;
    return `${months} month${months === 1 ? "" : "s"}`;
  }

  const years = (seconds / 31536000) | 0;
  return `${years} year${years === 1 ? "" : "s"}`;
}

function handleReplyButtonClick(event: MouseEvent) {
  const activeTextarea = document.getElementById("active-textarea") as HTMLTextAreaElement;

  if (activeTextarea) {
    const textareaContainer = activeTextarea.parentElement as HTMLDivElement;
    const feedbackButton = textareaContainer.getElementsByClassName(
      "notification-feedback-button",
    )[0] as HTMLButtonElement;
    feedbackButton.removeEventListener("click", sendMessageOnClick);
    feedbackButton.addEventListener("click", handleReplyButtonClick);
    feedbackButton.textContent = "Reply";
    activeTextarea.remove();
  }

  const button = event.target as HTMLButtonElement;
  button.removeEventListener("click", handleReplyButtonClick);
  button.addEventListener("click", sendMessageOnClick);
  button.textContent = "Cancel";
  const textarea = document.createElement("textarea");
  textarea.id = "active-textarea";
  textarea.oninput = () => {
    if (textarea.value.length === 0) {
      button.textContent = "Cancel";
    } else {
      button.textContent = "Send";
    }
    textarea.style.height = "0";
    textarea.style.height = `${textarea.scrollHeight + 2}px`;
  };
  button.insertAdjacentElement("beforebegin", textarea);
  textarea.focus();
}

async function sendMessageOnClick(event: Event) {
  const button = event.target as HTMLButtonElement;
  const textarea = document.getElementById("active-textarea") as HTMLTextAreaElement;
  if (textarea.value.length === 0) {
    button.textContent = "Reply";
    button.removeEventListener("click", sendMessageOnClick);
    button.addEventListener("click", handleReplyButtonClick);
    textarea.remove();
    return;
  }

  const { value } = textarea;
  const { url, typename, feedbacktype } = button.dataset;

  button.textContent = "Sending...";
  textarea.disabled = true;

  try {
    const fkey = await getUserFkeyCookie();
    const success = await addFeedback(
      fkey,
      url as string,
      typename as string,
      feedbacktype as string,
      value,
    );

    if (success) {
      button.textContent = "Success!";
      window.setTimeout(() => {
        button.textContent = "Reply";
        textarea.remove();
      }, 5000);
    } else {
      textarea.value = "Error in sending request.";
      button.textContent = "Failure!";
    }
  } catch (e) {
    console.error("Error in sending message: " + value + "; " + e);
    textarea.value = "Error in sending request: " + e;
  }
}
