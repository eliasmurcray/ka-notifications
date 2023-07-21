import { KaNotification } from "../@types/notification";
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
      return `<li class="notification ${brandNew === true ? "new" : ""}"><div class="notification-header"><img class="notification-author-avatar" src="${notification.authorAvatarUrl}"><h3 class="notification-author-nickname">${cleanse(notification.authorNickname)}</h3><a class="hyperlink" href="https://www.khanacademy.org${url}" target="_blank">${notification.feedbackType === "REPLY" ? "added a comment" : "answered your question"} on ${notification.focusTranslatedTitle}</a><span class="notification-date">${timeSince(new Date(date))} ago</span></div><div class="notification-content">${parseMarkdown(notification.content)}</div><div class="notification-feedback-container"><button class="notification-feedback-button" data-url="${url}" data-typename="ResponseFeedbackNotification" data-feedbackType="${notification.feedbackType}">Reply</button></div></li>`;
    case "ProgramFeedbackNotification":
      return `<li class="notification ${brandNew ? "new" : ""}"><div class="notification-header"><img class="notification-author-avatar" src="${notification.authorAvatarSrc}"><h3 class="notification-author-nickname">${cleanse(notification.authorNickname)}</h3><a class="hyperlink" href="https://www.khanacademy.org${url}" target="_blank">${notification.feedbackType === "COMMENT" ? "commented" : "asked a question"} on ${cleanse(notification.translatedScratchpadTitle)}</a><span class="notification-date">${timeSince(new Date(date))} ago</span></div><div class="notification-content">${parseMarkdown(notification.content)}</div><div class="notification-feedback-container"><button class="notification-feedback-button" data-url="${url}" data-typename="ProgramFeedbackNotification" data-feedbackType="${notification.feedbackType}">Reply</button></div></li>`;
    default:
      console.log(`Notification type ${notification.__typename} is currently unsupported.`);
      return `<li class="notification ${brandNew ? "new" : ""}"><div class="notification-header"><img class="notification-author-avatar" src="48.png"><h3 class="notification-author-nickname">Unsupported Notification Type</h3><span class="notification-date">${timeSince(new Date(date))}</span></div><div class="notification-content">${JSON.stringify(notification)}</div></li>`;
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

export function initUserInterface() {
  const themeButton = document.getElementById("theme-button");
  themeButton.onclick = () => {
    const isDark = document.body.className === "dark";
    if (isDark === true) {
      themeButton.innerHTML = '<svg stroke="#ffffff" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="18px" width="18px" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
    } else {
      themeButton.innerHTML = '<svg stroke="#ffffff" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="18px" width="18px" xmlns="http://www.w3.org/2000/svg"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
    }
  };
}
