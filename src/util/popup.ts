import { FeedbackQueryResponse } from "../@types/graphql";
import { KaNotification } from "../@types/notification";
import { addFeedback, getUserFkeyCookie, graphQLFetch, graphQLFetchJsonResponse } from "./graphql";
import { cleanse, parseMarkdown } from "./markdown";

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
      return `<li class="notification ${brandNew === true ? "new" : ""}"><div class="notification-header"><img class="notification-author-avatar" src="${notification.authorAvatarUrl}"><h3 class="notification-author-nickname">${cleanse(notification.authorNickname)}</h3><a class="hyperlink" href="https://www.khanacademy.org${url}" target="_blank">${notification.feedbackType === "REPLY" ? "added a comment" : "answered your question"} on ${notification.focusTranslatedTitle}</a><span class="notification-date">${timeSince(new Date(date))} ago</span></div><div class="notification-content">${parseMarkdown(notification.content)}</div><div class="notification-feedback-container"><button class="notification-feedback-button add-listeners" data-url="${url}" data-typename="ResponseFeedbackNotification" data-feedbacktype="${notification.feedbackType}">Reply</button></div></li>`;
    case "ProgramFeedbackNotification":
      return `<li class="notification ${brandNew ? "new" : ""}"><div class="notification-header"><img class="notification-author-avatar" src="${notification.authorAvatarSrc}"><h3 class="notification-author-nickname">${cleanse(notification.authorNickname)}</h3><a class="hyperlink" href="https://www.khanacademy.org${url}" target="_blank">${notification.feedbackType === "COMMENT" ? "commented" : "asked a question"} on ${cleanse(notification.translatedScratchpadTitle)}</a><span class="notification-date">${timeSince(new Date(date))} ago</span></div><div class="notification-content">${parseMarkdown(notification.content)}</div><div class="notification-feedback-container"><button class="notification-feedback-button add-listeners" data-url="${url}" data-typename="ProgramFeedbackNotification" data-feedbacktype="${notification.feedbackType}">Reply</button></div></li>`;
    default:
      console.log(`Notification type ${notification.__typename} is currently unsupported.`);
      return `<li class="notification ${brandNew ? "new" : ""}"><div class="notification-header"><img class="notification-author-avatar" src="48.png"><h3 class="notification-author-nickname">Unsupported Notification Type</h3><span class="notification-date">${timeSince(new Date(date))}</span></div><div class="notification-content">${JSON.stringify(notification)}</div></li>`;
  }
}

export function addReplyButtonEventListeners() {
  let replyButtons = document.getElementsByClassName("add-listeners");
  for (let i = replyButtons.length; i--; ) {
    replyButtons[i].addEventListener("click", handleReplyButtonClick);
    replyButtons[i].className = "notification-feedback-button";
  }
}

export function createNoNotificationsString(): string {
  return `<li class="notification new"><div class="notification-header"><img class="notification-author-avatar" src="32.png"><h3 class="notification-author-nickname">KA Notifications</h3></div><div class="notification-content">You have no notifications.</div></li>`;
}

export function createNoCookieString(): string {
  return `<li class="notification new"><div class="notification-header"><img class="notification-author-avatar" src="32.png"><h3 class="notification-author-nickname">KA Notifications</h3></div><div class="notification-content">Your authentication cookie has expired. Please <a class="hyperlink" href="https://khanacademy.org/" target="_blank">navigate to Khan Academy</a> to refresh it.</div></li>`;
}

export function createLoggedOutString(): string {
  return `<li class="notification new"><div class="notification-header"><img class="notification-author-avatar" src="32.png"><h3 class="notification-author-nickname">KA Notifications</h3></div><div class="notification-content">You are logged out. Please <a class="hyperlink" href="https://khanacademy.org/login" target="_blank">log in to Khan Academy</a> to use this extension.</div></li>`;
}
export function initUserInterface(theme: string) {
  /**
   * Theme button setup
   */
  const themeButton = document.getElementById("theme-button");
  if (theme === "dark") {
    document.body.className = theme;
    themeButton.innerHTML = '<svg stroke="#6b27d9" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="18px" width="18px" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
  }

  themeButton.onclick = () => {
    const isDark = document.body.className === "dark";
    if (isDark === true) {
      void chrome.storage.local.remove("theme");
      themeButton.innerHTML = '<svg stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="18px" width="18px" xmlns="http://www.w3.org/2000/svg"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
      document.body.className = "";
    } else {
      void chrome.storage.local.set({ theme: "dark" });
      themeButton.innerHTML = '<svg stroke="#6b27d9" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="18px" width="18px" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
      document.body.className = "dark";
    }
  };

  /**
   * Mark all read setup
   */

  const RAINBOW_HEADER = document.getElementById("rainbow-header");
  const markAllRead = document.getElementById("mark-all-read");
  let markAllReadLoading = false;

  markAllRead.onclick = async () => {
    if (markAllReadLoading === true) {
      return;
    }
    markAllReadLoading = true;
    RAINBOW_HEADER.classList.remove("stopped");
    try {
      const fkey = await getUserFkeyCookie();
      const response = await graphQLFetchJsonResponse("clearBrandNewNotifications", fkey);
      if (response.value) {
        RAINBOW_HEADER.classList.add("stopped");
        markAllReadLoading = false;
        void chrome.action.setBadgeText({ text: "" });
      }
    } catch (e) {
      console.error(e);
    }
  };

  /**
   * Page switching
   */

  const settingsButton = document.getElementById("settings-button");
  const notificationsSection = document.getElementById("notifications-section");
  const settingsSection = document.getElementById("settings-section");

  settingsButton.onclick = () => {
    notificationsSection.classList.toggle("hidden");
    settingsSection.classList.toggle("hidden");

    if (settingsSection.classList.contains("hidden")) {
      settingsButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18px" height"18px"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M19.1 13a7 7 0 0 0 0-2l2-1.5c.2-.2.3-.4.2-.6l-2-3.3a.5.5 0 0 0-.5-.3l-2.4 1a7 7 0 0 0-1.6-1l-.4-2.5c0-.2-.2-.4-.5-.4h-3.8c-.3 0-.4.2-.5.4l-.3 2.5-1.7 1-2.4-1c-.2 0-.4 0-.5.3l-2 3.3c0 .2 0 .4.2.6l2 1.6-.1.9v1l-2 1.5c-.1.2-.2.4 0 .6l1.8 3.3c.2.3.4.3.6.3l2.4-1 1.6 1 .4 2.5c0 .2.2.4.5.4h3.8c.3 0 .5-.2.5-.4l.4-2.6 1.6-.9 2.4 1c.2 0 .4 0 .6-.3l1.9-3.3-.1-.6-2-1.6zM12 15.5a3.6 3.6 0 1 1 0-7.2 3.6 3.6 0 0 1 0 7.2z"/></svg>';
    } else {
      settingsButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 0 24 24" width="18px"><path d="M0 0h24v24H0V0z" fill="#00000000"/><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-1.29 1.29c-.63.63-.19 1.71.7 1.71h13.17c.89 0 1.34-1.08.71-1.71L18 16z"/></svg>';
    }
  };

  const commentSortInput = document.getElementById("sort-comments") as HTMLInputElement;

  (async () => {
    const { commentSort } = await chrome.storage.local.get("commentSort");
    if (commentSort) {
      commentSortInput.value = commentSort;
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
  const activeTextarea = document.getElementById("active-textarea");

  if (activeTextarea) {
    let button = activeTextarea.parentElement.getElementsByClassName("notification-feedback-button")[0] as HTMLButtonElement;
    button.removeEventListener("click", sendMessageOnClick);
    button.addEventListener("click", handleReplyButtonClick);
    button.textContent = "Reply";
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
    const success = await addFeedback(fkey, url, typename, feedbacktype, value);

    if (success === true) {
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

// async function getFeedbackParent(fkey: string, url: string, typename: string): Promise<string | null> {
//   if (typename !== "ResponseFeedbackNotification" && typename !== "ProgramFeedbackNotification") {
//     return null;
//   }
//   const params = new URL("https://www.khanacademy.org/" + url).searchParams;

//   const response = await graphQLFetch("feedbackQuery", fkey, {
//     topicId: url.split("?")[0].split("/").slice(-1)[0],
//     feedbackType: params.get("qa_expand_type") === "reply" ? "QUESTION" : "COMMENT",
//     currentSort: 1,
//     qaExpandKey: params.get("qa_expand_key"),
//     focusKind: "scratchpad",
//   });

//   const json: FeedbackQueryResponse = await response.json();

//   if (json.data.errors === undefined && json.data?.feedback?.feedback[0]?.expandKey) {
//     return json.data.feedback.feedback[0].expandKey;
//   }
//   console.error(`Error in retrieving feedback parent with URL ${url} and errors ${json.data.errors}`);
//   return null;
// }
