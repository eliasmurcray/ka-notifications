import { FeedbackQueryResponse } from "../@types/graphql";
import { KaNotification } from "../@types/notification";
import { addFeedback, getUserFkeyCookie, graphQLFetch } from "./graphql";
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
  if (theme !== undefined) {
    document.body.className = theme;
  }

  const themeButton = document.getElementById("theme-button");
  themeButton.onclick = () => {
    const isDark = document.body.className === "dark";
    if (isDark === true) {
      themeButton.innerHTML = '<svg stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="18px" width="18px" xmlns="http://www.w3.org/2000/svg"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
      document.body.className = "";
    } else {
      themeButton.innerHTML = '<svg stroke="#6b27d9" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="18px" width="18px" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
      document.body.className = "dark";
    }
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
