import { Notification, AvatarNotification, BadgeNotification, BasicNotification, GroupedBadgeNotification, ModeratorNotification, ProgramFeedbackNotification, ResponseFeedbackNotification } from "../@types/notification";
import { graphQLFetch, getChromeFkey } from "./graphql";
import { escapeHTML, parseAndRender } from "./markdown";
import AVATAR_SHORTNAMES from "../json/avatar-shortnames.json";
import AVATAR_REQUIREMENTS from "../json/avatar-requirements.json";
import { NotificationsResponse, GetNotificationsForUserResponse, FeedbackQueryResponse } from "../@types/responses";

// Shorthand to create element
function _element (type: string, className: string): HTMLElement {
  const element = document.createElement(type);
  element.className = className;
  return element;
}

// Gets the time since a date as a string
function timeSince (date: Date): string {
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

function addFeedbackTextarea (button: HTMLButtonElement, requestType: RequestType, responseType: ResponseType, id: string, qaExpandKey: string, qaExpandType: string, focusKind = "scratchpad") {
  const originalOnClick = button.onclick;
  const textarea = _element("textarea", "notification-reply-textarea") as HTMLTextAreaElement;
  button.parentElement.insertAdjacentElement("beforebegin", textarea);
  textarea.focus();
  textarea.style.height = "0";
  textarea.style.height = `${textarea.scrollHeight}px`;
  textarea.oninput = () => {
    textarea.style.height = "0";
    textarea.style.height = `${textarea.scrollHeight}px`;
  };
  button.innerText = "Send";
  button.onclick = () => {
    if(textarea.value === "") {
      button.innerText = "Reply";
      button.onclick = originalOnClick;
      textarea.remove();
      return;
    } else {
      button.innerText = "Sending";
      const spinner = _element("div", "mini-loading-spinner");
      spinner.innerHTML = "<div></div><div></div><div></div>";
      spinner.style.display = "inline-block";
      button.insertAdjacentElement("afterend", spinner);
      addFeedback(requestType, responseType, id, qaExpandKey, textarea.value, qaExpandType, focusKind)
        .then(() => {
          button.innerText = "Sent";
          spinner.remove();
          textarea.remove();
        })
        .catch(console.error);
    }
  };
}

// Send a message given a valid program ID and qakey
type RequestType = "QUESTION" | "COMMENT";
type ResponseType = "REPLY" | "ANSWER";
async function addFeedback (feedbackType: RequestType, responseType: ResponseType, topicId: string, qaExpandKey: string, textContent: string, expandType: string, focusKind = "scratchpad"): Promise<void | Response> {
  return await getChromeFkey()
    .then((fkey) =>
      graphQLFetch("feedbackQuery", fkey, {
        topicId,
        feedbackType,
        currentSort: 1,
        qaExpandKey,
        focusKind
      })
        .then(async (response) => {
          const json = await response.json() as FeedbackQueryResponse;
          const sub = json.data.feedback.feedback[0];
          const key: string = feedbackType === "QUESTION" && expandType === "answer" ? sub.answers[0].key : sub.key;
          return graphQLFetch("AddFeedbackToDiscussion", fkey, { parentKey: key, textContent, feedbackType: responseType });
        }))
    .catch((error) => {
      console.error("Error in sending feedback: ", error);
    });
}

// Creates an HTMLDivElement from a Notification object
export function createNotificationHTMLDivElement (notification: Notification): HTMLDivElement {
  const { __typename, brandNew, date, url } = notification;

  // This base element is the same no matter what type
  const notificationElement = _element("li", "notification" + (brandNew ? " unread" : ""));

  switch(__typename) {
    case "ResponseFeedbackNotification": {
      const { authorAvatarUrl, authorNickname, content, feedbackType, focusTranslatedTitle } = notification as ResponseFeedbackNotification & BasicNotification;
      notificationElement.innerHTML = `<div class='notification-header'><img class='notification-author--avatar' src='${authorAvatarUrl}'><h3 class='notification-author--nickname'>${escapeHTML(authorNickname)}</h3><a class='hyperlink' href='https://www.khanacademy.org${url}' target='_blank'>${feedbackType === "REPLY" ? "added a comment" : "answered your question"} on ${focusTranslatedTitle}</a><span class='notification-date'>${timeSince(new Date(date))} ago</span></div><div class='notification-content'>${parseAndRender(content)}</div>`;

      const wrapper = _element("div", "feedback-button-wrapper");
      const button = _element("button", "feedback-button") as HTMLButtonElement;
      button.innerText = "Reply";

      const split = url.split("/");
      const responseID = split[split.length - 1].split("?")[0];
      const params = new URLSearchParams(url.split("?")[1]);
      const qaExpandKey = params.get("qa_expand_key");
      const qaExpandType = params.get("qa_expand_type");

      button.onclick = () => addFeedbackTextarea(button, feedbackType === "ANSWER" ? "QUESTION" : "COMMENT", "REPLY", responseID, qaExpandKey, qaExpandType);
      wrapper.appendChild(button);
      notificationElement.appendChild(wrapper);
    }
      break;
    case "ProgramFeedbackNotification": {
      const { authorAvatarSrc, authorNickname, content, feedbackType, translatedScratchpadTitle } = notification as ProgramFeedbackNotification & BasicNotification;
      notificationElement.innerHTML = `<div class='notification-header'><img class='notification-author--avatar' src='${authorAvatarSrc}'><h3 class='notification-author--nickname'>${escapeHTML(authorNickname)}</h3><a class='hyperlink' href='https://www.khanacademy.org${url}' target='_blank'>${feedbackType === "COMMENT" ? "commented" : "asked a question"} on ${translatedScratchpadTitle}</a><span class='notification-date'>${timeSince(new Date(date))} ago</span></div><div class='notification-content'>${parseAndRender(content)}</div>`;

      // Extract the id and qa_expand_key from the url
      const split = url.split("/");
      const responseID = split[split.length - 1].split("?")[0];
      const params = new URLSearchParams(url.split("?")[1]);
      const qaExpandKey = params.get("qa_expand_key");

      const wrapper = _element("div", "feedback-button-wrapper");
      const addFeedbackButton = _element("button", "feedback-button");
      addFeedbackButton.innerText = "Reply";
      addFeedbackButton.onclick = () => addFeedbackTextarea(addFeedbackButton as HTMLButtonElement, feedbackType as RequestType, feedbackType === "QUESTION" ? "ANSWER" : "REPLY", responseID, qaExpandKey, "");
      wrapper.appendChild(addFeedbackButton);
      notificationElement.appendChild(wrapper);
    }
      break;
    case "GroupedBadgeNotification": {
      let badgeString = "";
      const { badgeNotifications } = notification as GroupedBadgeNotification & BasicNotification;
      if(badgeNotifications.length === 2) {
        badgeString = badgeNotifications[0].badge.description + " and " + badgeNotifications[1].badge.description;
      } else {
        badgeString = badgeNotifications.map((badge) => badge.badge.description).slice(0, -1).join(", ") + ", and " + badgeNotifications[badgeNotifications.length - 1].badge.description;
      }
      notificationElement.innerHTML = `<div class='notification-header'><img class='notification-author--avatar' src='${badgeNotifications[0].badge.icons.compactUrl}'><h3 class='notification-author--nickname'>KA Badges</h3><a class='hyperlink' href='https://www.khanacademy.org${url}' target='_blank'>view badges</a><span class='notification-date'>${timeSince(new Date(date))} ago</span></div><p class='notification-content'>You earned ${badgeString}! Congratulations!</p>`;
    }
      break;
    case "BadgeNotification": {
      const { badge: { description, icons: { compactUrl }, relativeUrl } } = notification as BadgeNotification & BasicNotification;
      notificationElement.innerHTML = `<div class='notification-header'><img class='notification-author--avatar' src='${compactUrl}'><h3 class='notification-author--nickname'>KA Badges</h3><a class='hyperlink' href='https://www.khanacademy.org${relativeUrl}' target='_blank'>view badges</a><span class='notification-date'>${timeSince(new Date(date))} ago</span></div><p class='notification-content'>You earned ${description}! Congratulations!</p>`;
    }
      break;
    case "ModeratorNotification": {
      const { text } = notification as ModeratorNotification & BasicNotification;
      notificationElement.innerHTML = `<div class='notification-header'><img class='notification-author--avatar' src='guardian-icon.png'><h3 class='notification-author--nickname'>KA Guardian</h3><span class='notification-date'>${timeSince(new Date(date))} ago</span></div><p class='notification-content'>${text}</p>`;
    }
      break;
    case "AvatarNotification": {
      const { name, thumbnailSrc, url } = notification as AvatarNotification & BasicNotification;
      notificationElement.innerHTML = `<div class='notification-header'><img class='notification-author--avatar' src='${thumbnailSrc.startsWith("https://cdn.kastatic.org/") ? thumbnailSrc : "https://cdn.kastatic.org" + thumbnailSrc}'><h3 class='notification-author--nickname'>KA Avatars</h3><a class='hyperlink' href='https://www.khanacademy.org${url}' target='_blank'>use avatar</a><span class='notification-date'>${timeSince(new Date(date))} ago</span></div><p class='notification-content'>You unlocked <b>${AVATAR_SHORTNAMES[name] as string}</b>! <i>${AVATAR_REQUIREMENTS[name] as string}</i></p>`;
    }
      break;
    default:
      notificationElement.innerHTML = `<div class=\"notification-header\"><img class=\"notification-author--avatar\" src=\"32.png\"><h3 class=\"notification-author--nickname\">KA Notifications</h3></div><div class="notification-content">This is an unhandled notification type. You can report this in our <a class="hyperlink" href="https://github.com/eliasmurcray/ka-notifications/issues" target="_blank">official Github repository</a>.</div><pre>${JSON.stringify(notification, null, 2)}</pre>`;
  }
  return notificationElement as HTMLDivElement;
}

// Creates HTMLDivElement
export function renderFromCache (parentElement: HTMLDivElement, cache: { preloadString: string, cursor: string }): void {
  parentElement.innerHTML += cache.preloadString;
  parentElement
    .querySelectorAll(".feedback-button")
    .forEach((button: HTMLButtonElement) => {
      const { typename, url, feedbackType } = button.dataset;
      if(typename === "ResponseFeedbackNotification") {
        // Extract the id and qa_expand_key from the url
        const split = url.split("/");
        const responseID = split[split.length - 1].split("?")[0];
        const params = new URLSearchParams(url.split("?")[1]);
        const qaExpandKey = params.get("qa_expand_key");
        const qaExpandType = params.get("qa_expand_type");

        button.onclick = () => addFeedbackTextarea(button, feedbackType === "ANSWER" ? "QUESTION" : "COMMENT", "REPLY", responseID, qaExpandKey, qaExpandType);
      } else {
        const split = url.split("/");
        const responseID = split[split.length - 1].split("?")[0];
        const params = new URLSearchParams(url.split("?")[1]);
        const qaExpandKey = params.get("qa_expand_key");
        button.onclick = () => addFeedbackTextarea(button, feedbackType as RequestType, feedbackType === "QUESTION" ? "ANSWER" : "REPLY", responseID, qaExpandKey, "");
      }
    });
}

async function getFeedbackParent (fkey: string, notification: Notification): Promise<string> {
  const params = new URL("https://www.khanacademy.org/" + notification.url).searchParams;
  return new Promise((resolve) => {
    if(!["ResponseFeedbackNotification", "ProgramFeedbackNotification"].includes(notification.__typename)) {
      return resolve(null);
    }
    graphQLFetch("feedbackQuery", fkey, {
      topicId: notification.url.split("?")[0].split("/").slice(-1)[0],
      feedbackType: params.get("qa_expand_type") === "reply" ? "QUESTION" : "COMMENT",
      currentSort: 1,
      qaExpandKey: params.get("qa_expand_key"),
      focusKind: "scratchpad"
    })
      .then(async (response) => response.json())
      .then((json: FeedbackQueryResponse) => {
        if(json.data.errors === undefined && json.data?.feedback?.feedback[0]?.expandKey) {
          resolve(json.data.feedback.feedback[0].expandKey);
        } else {
          console.error("ERROR: ", notification.url, json.data.errors);
          resolve(null);
        }
      })
      .catch((error: string) => {
        console.error(error);
        resolve(error);
      });
  });
}

export async function filterNotifications (fkey: string, notifications: Notification[]): Promise<Notification[]> {
  fkey;
  const promises = notifications.map(async (notification) => {
    const parent = await getFeedbackParent(fkey, notification);
    return parent === "" ? false : notification;
  });

  const array = (await Promise.all(promises)).filter((allowed: Notification | boolean) => allowed !== false) as Notification[];

  return array;
}

// Creates a generator to load notifications
export async function* createNotificationsGenerator (cursor = ""):  AsyncGenerator<Notification[], Notification[]>{
  let complete = false;
  while(complete === false) {
    const json = await new Promise<NotificationsResponse>((resolve) => {
      getChromeFkey()
        .then((fkey) => {
          graphQLFetch("getNotificationsForUser", fkey, { after: cursor })
            .then(async (response) => {
              const json = await response.json() as GetNotificationsForUserResponse;
              const notificationsResponse = json?.data?.user?.notifications;
              if(!notificationsResponse) {
                return resolve(null);
              }

              // Filter out the unwanted threads
              // notificationsResponse.notifications = await filterNotifications(fkey, notificationsResponse.notifications);

              resolve(notificationsResponse);
            })
            .catch(() => resolve(null));
        })
        .catch(console.error);
    });

    if(json) {
      // Retrieve a cursor from the JSON
      const nextCursor = json.pageInfo.nextCursor;

      // Update loop control variables
      complete = !nextCursor;
      cursor = nextCursor;

      // Return this set of notifications as JSON
      yield json.notifications;
    } else {
      break;
    }
  }
  return;
}

export function createNotificationString (notification: Notification): string {
  const { __typename, brandNew, date, url } = notification;
  switch(__typename) {
    case "ResponseFeedbackNotification": {
      const { authorAvatarUrl, authorNickname, content, feedbackType, focusTranslatedTitle } = notification as ResponseFeedbackNotification & BasicNotification;
      return `<li class="notification ${brandNew ? "unread" : ""}"><div class="notification-header"><img class="notification-author--avatar" src="${authorAvatarUrl}"><h3 class="notification-author--nickname">${escapeHTML(authorNickname)}</h3><a class="hyperlink" href="https://www.khanacademy.org${url}" target="_blank">${feedbackType === "REPLY" ? "added a comment" : "answered your question"} on ${focusTranslatedTitle}</a><span class="notification-date">${timeSince(new Date(date))} ago</span></div><div class="notification-content">${parseAndRender(content)}</div><div class="feedback-button-wrapper"><button class="feedback-button" data-url="${url}" data-typename="ResponseFeedbackNotification" data-feedbackType="${feedbackType}">Reply</button></div></li>`;
    }
    case "ProgramFeedbackNotification": {
      const { authorAvatarSrc, authorNickname, content, feedbackType, translatedScratchpadTitle } = notification as ProgramFeedbackNotification & BasicNotification;
      return `<li class="notification ${brandNew ? "unread" : ""}"><div class="notification-header"><img class="notification-author--avatar" src="${authorAvatarSrc}"><h3 class="notification-author--nickname">${escapeHTML(authorNickname)}</h3><a class="hyperlink" href="https://www.khanacademy.org${url}" target="_blank">${feedbackType === "COMMENT" ? "commented" : "asked a question"} on ${translatedScratchpadTitle}</a><span class="notification-date">${timeSince(new Date(date))} ago</span></div><div class="notification-content">${parseAndRender(content)}</div><div class="feedback-button-wrapper"><button class="feedback-button" data-url="${url}" data-typename="ProgramFeedbackNotification" data-feedbackType="${feedbackType}">Reply</button></div></li>`;
    }
    case "GroupedBadgeNotification": {
      let badgeString = "";
      const { badgeNotifications } = notification as GroupedBadgeNotification & BasicNotification;
      if(badgeNotifications.length === 2) {
        badgeString = badgeNotifications[0].badge.description + " and " + badgeNotifications[1].badge.description;
      } else {
        badgeString = badgeNotifications.map((badge) => badge.badge.description).slice(0, -1).join(", ") + ", and " + badgeNotifications[badgeNotifications.length - 1].badge.description;
      }
      return `<li class="notification ${brandNew ? "unread" : ""}"><div class="notification-header"><img class="notification-author--avatar" src="${badgeNotifications[0].badge.icons.compactUrl}"><h3 class="notification-author--nickname">KA Badges</h3><a class="hyperlink" href="https://www.khanacademy.org${url}" target="_blank">view badges</a><span class="notification-date">${timeSince(new Date(date))} ago</span></div><p class="notification-content">You earned ${badgeString}! Congratulations!</p></li>`;
    }
    case "BadgeNotification": {
      const { badge: { description, icons: { compactUrl }, relativeUrl } } = notification as BadgeNotification & BasicNotification;
      `<li class="notification ${brandNew ? "unread" : ""}"><div class="notification-header"><img class="notification-author--avatar" src="${compactUrl}"><h3 class="notification-author--nickname">KA Badges</h3><a class="hyperlink" href="https://www.khanacademy.org${relativeUrl}" target="_blank">view badges</a><span class="notification-date">${timeSince(new Date(date))} ago</span></div><p class="notification-content">You earned ${description}! Congratulations!</p></li>`;
    }
    case "ModeratorNotification": {
      const { text } = notification as ModeratorNotification & BasicNotification;
      return `<li class="notification ${brandNew ? "unread" : ""}"><div class="notification-header"><img class="notification-author--avatar" src="guardian-icon.png"><h3 class="notification-author--nickname">KA Guardian</h3><span class="notification-date">${timeSince(new Date(date))} ago</span></div><p class="notification-content">${text}</p></li>`;
    }
    case "AvatarNotification": {
      const { name, thumbnailSrc, url } = notification as AvatarNotification & BasicNotification;
      return `<li class="notification ${brandNew ? "unread" : ""}"><div class="notification-header"><img class="notification-author--avatar" src="${thumbnailSrc.startsWith("https://cdn.kastatic.org/") ? thumbnailSrc : "https://cdn.kastatic.org" + thumbnailSrc}"><h3 class="notification-author--nickname">KA Avatars</h3><a class="hyperlink" href="https://www.khanacademy.org${url}" target="_blank">use avatar</a><span class="notification-date">${timeSince(new Date(date))} ago</span></div><p class="notification-content">You unlocked <b>${AVATAR_SHORTNAMES[name] as string}</b>! <i>${AVATAR_REQUIREMENTS[name] as string}</i></p></li>`;
    }
    default:
      return `<li class="notification"><div class=\"notification-header\"><img class=\"notification-author--avatar\" src=\"32.png\"><h3 class=\"notification-author--nickname\">KA Notifications</h3></div><div class="notification-content">This is an unhandled notification type. You can report this in our <a class="hyperlink" href="https://github.com/eliasmurcray/ka-notifications/issues" target="_blank">official Github repository</a>.</div><pre>${JSON.stringify(notification, null, 2)}</pre></li>`;
  }
}
