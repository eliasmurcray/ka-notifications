import { KaNotification } from "../@types/notification";
import { cleanse, parseMarkdown } from "./markdown";

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

// {
//   "__typename": "ResponseFeedbackNotification",
//   "authorAvatarUrl": "https://cdn.kastatic.org/images/avatars/svg/cs-hopper-cool.svg",
//   "authorNickname": "Bearkirb314🐻‍❄️",
//   "brandNew": true,
//   "class_": [
//       "BaseNotification",
//       "ReadableNotification",
//       "BaseFeedbackNotification",
//       "ResponseFeedbackNotification"
//   ],
//   "content": "Hello Subscribers, I have a program that is a demonstration of something I have been working on for quite a while.  With a combination of 3D, fractals, z-sorting, and lighting, I feel great about finally being able to share this with you all.\n\nhttps://www.khanacademy.org/computer-programming/mandelbrot-island/6665937676451840",
//   "date": "2023-07-16T21:40:15.473342Z",
//   "feedbackType": "REPLY",
//   "focusTranslatedTitle": "Bearkirb Subpage",
//   "kaid": "kaid_80710011086149831327935",
//   "read": false,
//   "sumVotesIncremented": 1,
//   "url": "/computer-programming/bearkirb-subpage/6113592068325376?qa_expand_key=ag5zfmtoYW4tYWNhZGVteXJACxIIVXNlckRhdGEiHWthaWRfMzc1NDYwMTEyNTUwODkzODI4Njg5OTUzDAsSCEZlZWRiYWNrGICAs_qAreUIDA&qa_expand_type=reply",
//   "urlsafeKey": "ag5zfmtoYW4tYWNhZGVteXIdCxIQQmFzZU5vdGlmaWNhdGlvbhiAgLPml6ScCQw"
// }

export default function createNotificationString(notification: KaNotification) {
  const { brandNew, date, url } = notification;
  switch (notification.__typename) {
    case "ResponseFeedbackNotification":
      return `<li class="notification ${brandNew === true ? "new" : ""}"><div class="notification-header"><img class="notification-author-avatar" src="${notification.authorAvatarUrl}"><h3 class="notification-author-nickname">${cleanse(notification.authorNickname)}</h3><a class="hyperlink" href="https://www.khanacademy.org${url}" target="_blank">${notification.feedbackType === "REPLY" ? "added a comment" : "answered your question"} on ${notification.focusTranslatedTitle}</a><span class="notification-date">${timeSince(new Date(date))} ago</span></div><div class="notification-content">${parseMarkdown(notification.content)}</div><div class="notification-feedback-container"><button class="notification-feedback-button" data-url="${url}" data-typename="ResponseFeedbackNotification" data-feedbackType="${notification.feedbackType}">Reply</button></div></li>`;
      break;
    case "ProgramFeedbackNotification":
      return `<li class="notification ${brandNew ? "new" : ""}"><div class="notification-header"><img class="notification-author-avatar" src="${notification.authorAvatarSrc}"><h3 class="notification-author-nickname">${cleanse(notification.authorNickname)}</h3><a class="hyperlink" href="https://www.khanacademy.org${url}" target="_blank">${notification.feedbackType === "COMMENT" ? "commented" : "asked a question"} on ${cleanse(notification.translatedScratchpadTitle)}</a><span class="notification-date">${timeSince(new Date(date))} ago</span></div><div class="notification-content">${parseMarkdown(notification.content)}</div><div class="notification-feedback-container"><button class="notification-feedback-button" data-url="${url}" data-typename="ProgramFeedbackNotification" data-feedbackType="${notification.feedbackType}">Reply</button></div></li>`;
      break;
  }
}
