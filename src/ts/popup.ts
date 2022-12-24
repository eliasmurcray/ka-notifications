import QUERIES from "../graphql-queries.json";
import "../css/popup.css";

type Badge = {
  description: string,
  relativeUrl: string,
  compactUrl: string,
  icons: {
    compactUrl: string
  }
};

type Notification = {
  authorAvatarUrl?: string,
  authorAvatarSrc?: string,
  authorNickname?: string,
  badge?: Badge,
  badgeNotifications?: Array<{
    badge: Badge
  }>,
  brandNew: boolean,
  content?: string,
  date: string,
  feedbackType?: string,
  focusTranslatedTitle?: string,
  url?: string,
  text?: string,
  translatedScratchpadTitle?: string,
  __typename: string
};

type NotificationsResponse = {
  notifications: Notification[];
  pageInfo: {
    nextCursor: string;
  };
};

// Retrieve items from local storage
const STORAGE: { [key:string]: string } = await chrome.storage.local.get(["notificationsHtml", "notificationsCursor", "notificationsTheme"]);
const { notificationsHtml, notificationsCursor } = STORAGE;
let notificationsTheme = STORAGE.notificationsTheme ?? "light";

// Persist HTML from last time, if possible
if(notificationsHtml) document.body.innerHTML = notificationsHtml;

// Now that HTML is persisted, retrieve DOM elements
const loadingContainer = document.getElementById("loading-container") as HTMLDivElement;
const notificationsContainer = document.getElementById("notifications-container") as HTMLDivElement;
const notificationsSection = document.getElementById("notifications-section") as HTMLDivElement;
const themeButton = document.getElementById("theme-button") as HTMLButtonElement;
const markAllRead = document.getElementById("mark-all-read") as HTMLButtonElement;
const markReadLoading = document.getElementById("mark-read-loading") as HTMLDivElement;

// Persist notifications cursor from last time, if possible
let notificationsGenerator = createNotificationsGenerator(notificationsCursor ?? "");

// Initial load, only if there is no key
if(!notificationsCursor)
  getNextNotifications();

AddEventListeners();

// Whether or not we are currently loading data, used by the scroll listener
let notLoading: boolean = true;

// Uses the notificationGenerator to retrieve the next page of notifications
async function getNextNotifications(): Promise<void> {
  // If we have new notifications, refresh notification page
  if((await chrome.storage.local.get("newNotifications")).newNotifications === true) {
    notificationsGenerator = createNotificationsGenerator();
    await chrome.storage.local.set({ "newNotifications": false });
  }

  // Retrieve next page of notifications
  notificationsGenerator.next().then(({ value: notifications }) => {
    // If user is not logged in
    if(notifications === undefined) {
      loadingContainer.remove();
      notificationsContainer.innerHTML = `<li class="notification unread"><div class="notification-header"><img class="notification-author--avatar" src="32.png"><h3 class="notification-author--nickname">KA Notifications</h3><span class="notification-date">${timeSince(new Date())} ago</span></div><p class="notification-content">You must be <a class="hyperlink" href="https://www.khanacademy.org/login/" target="_blank">logged in</a> to use this extension.</p></li>`;
      return;
    }

    // Log notifications for development purposes
    console.log(notifications);

    // Add notifications to DOM
    notificationsContainer.innerHTML += notifications.map((notification) => createNotificationString(notification)).join("");
    // Save HTML to local storage
    chrome.storage.local.set({ "notificationsHtml": document.body.innerHTML });
    // Allow notification loading now that task is complete
    notLoading = true;
  });
}

// Returns generator function that gets user notifications
async function* createNotificationsGenerator(cursor = ""):  AsyncGenerator<Notification[], Notification[]>{
  let complete = false;
  for(;!complete;) {
    // Retrieve user notifications as JSON
    const json: NotificationsResponse = (await graphQLFetch("getNotificationsForUser", await getChromeFkey(), { after: cursor }))?.data?.user?.notifications;

    if(json) {
      // Retrieve a cursor from the JSON
      const nextCursor = json.pageInfo.nextCursor;

      // Update loop control variables
      complete = !nextCursor;
      cursor = nextCursor ?? "";

      // chrome.storage Update cursor value
      chrome.storage.local.set({ "notificationsCursor": cursor });

      // Return this set of notifications as JSON
      yield json.notifications;
    } else break;
  }
  return;
}

function graphQLFetch(query: string, fkey: string, variables: { [key: string]: string } = {}): Promise<{ [key:string]: any }> {
  return new Promise((resolve, reject) => {
    fetch("https://www.khanacademy.org/api/internal/graphql/_mt/" + query, {
      method: "POST",
      headers: {
        "X-KA-fkey": fkey,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        operationName: query,
        query: QUERIES[query]
      }),
      credentials: "same-origin"
    })
    .then(async (response: Response) => {
      if (response.status === 200) return resolve(await response.json());
      reject(`Error in GraphQL ${query} call: Server responded  with status ${response.status} and body ${JSON.stringify(await response.text())}`);
    });
  });
}

function getChromeFkey(): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.cookies.get({
      url: "https://www.khanacademy.org",
      name: "fkey"
    }, (cookie) => {
      if (cookie === null) reject("fkey cookie not found.");
      resolve(cookie.value);
    });
  });
}

function escapeHTML(text: string): string {
  return text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function timeSince(date: Date): string {
  const seconds = ~~((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) {
    return `${seconds} second${seconds === 1 ? '' : 's'}`;
  }

  if (seconds < 3600) {
    const minutes = ~~(seconds / 60);
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  }

  if (seconds < 86400) {
    const hours = ~~(seconds / 3600);
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  }

  if (seconds < 2592000) {
    const days = ~~(seconds / 86400);
    return `${days} day${days === 1 ? '' : 's'}`;
  }

  if (seconds < 31536000) {
    const months = ~~(seconds / 2592000);
    return `${months} month${months === 1 ? '' : 's'}`;
  }

  const years = ~~(seconds / 31536000);
  return `${years} year${years === 1 ? '' : 's'}`;
}

// Creates an HTML parsable string from a Notification object
function createNotificationString(notification: Notification): string {
  switch(notification.__typename) {
    case "ResponseFeedbackNotification": {
      const { authorAvatarUrl, authorNickname, brandNew, content, date, focusTranslatedTitle, url } = notification;
      return `<li class="notification ${brandNew ? " unread" : ""}"><div class="notification-header"><img class="notification-author--avatar" src="${authorAvatarUrl}"><h3 class="notification-author--nickname">${escapeHTML(authorNickname)}</h3><a class="hyperlink" href="https://www.khanacademy.org${url}" target="_blank">commented on ${focusTranslatedTitle}</a><span class="notification-date">${timeSince(new Date(date))} ago</span></div><p class="notification-content">${escapeHTML(content)}</p></li>`;
    }
    break;
    case "ProgramFeedbackNotification": {
      const { authorAvatarSrc, authorNickname, brandNew, content, date, feedbackType, translatedScratchpadTitle, url } = notification;
      return `<li class="notification ${brandNew ? " unread" : ""}"><div class="notification-header"><img class="notification-author--avatar" src="${authorAvatarSrc}"><h3 class="notification-author--nickname">${escapeHTML(authorNickname)}</h3><a class="hyperlink" href="https://www.khanacademy.org${url}" target="_blank">${feedbackType === "COMMENT" ? "commented" : "asked a question"} on ${translatedScratchpadTitle}</a><span class="notification-date">${timeSince(new Date(date))} ago</span></div><p class="notification-content">${escapeHTML(content)}</p></li>`;
    }
    break;
    case "GroupedBadgeNotification": {
      let badgeString = "";
      const { badgeNotifications, brandNew, date, url } = notification;
      if(badgeNotifications.length === 2)
        badgeString = badgeNotifications[0].badge.description + " and " + badgeNotifications[1].badge.description;
      else
        badgeString = badgeNotifications.map((badge) => badge.badge.description).slice(0, -1).join(", ") + ", and " + badgeNotifications[badgeNotifications.length - 1].badge.description;
      return `<li class="notification ${brandNew ? " unread" : ""}"><div class="notification-header"><img class="notification-author--avatar" src="${badgeNotifications[0].badge.icons.compactUrl}"><h3 class="notification-author--nickname">KA Badges</h3><a class="hyperlink" href="https://www.khanacademy.org${url}" target="_blank">view badges</a><span class="notification-date">${timeSince(new Date(date))} ago</span></div><p class="notification-content">You earned ${badgeString}! Congratulations!</p></li>`;
    }
    break;
    case "BadgeNotification": {
      const { badge: { description, icons: { compactUrl }, relativeUrl }, brandNew, date } = notification;
      return `<li class="notification ${brandNew ? " unread" : ""}"><div class="notification-header"><img class="notification-author--avatar" src="${compactUrl}"><h3 class="notification-author--nickname">KA Badges</h3><a class="hyperlink" href="https://www.khanacademy.org${relativeUrl}" target="_blank">view badges</a><span class="notification-date">${timeSince(new Date(date))} ago</span></div><p class="notification-content">You earned ${description}! Congratulations!</p></li>`;
    }
    break;
    case "ModeratorNotification": {
      const { brandNew, date, text } = notification;
      return `<li class="notification ${brandNew ? " unread" : ""}"><div class="notification-header"><img class="notification-author--avatar" src="guardian-icon.png"><h3 class="notification-author--nickname">KA Badges</h3><span class="notification-date">${timeSince(new Date(date))} ago</span></div><p class="notification-content">${text}</p></li>`;
    }
    break;
    default:
      return `<li class="notification"><pre style="width:100%;overflow-x:auto">${JSON.stringify(notification, null, 2)}</pre></li>`;
    }
}

// Updates the UI based on current theme
function updateFromTheme(): void {
  if(notificationsTheme === "light") {
    themeButton.innerHTML = '<svg stroke="#ffffff" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="18px" width="18px" xmlns="http://www.w3.org/2000/svg"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
    document.body.className = "light";
  } else {
    themeButton.innerHTML = '<svg stroke="#ffffff" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="18px" width="18px" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
    document.body.className = "dark";
  }
}

// Clears all unread notifications
function clearNotifications(): Promise<{ [key: string]: string }> {
  return new Promise((resolve, reject) => {
    getChromeFkey()
      .then((fkey) => graphQLFetch("clearBrandNewNotifications", fkey))
      .then(resolve)
      .catch(reject)
  });
}

function AddEventListeners() {

  // Theme changer
  updateFromTheme();
  themeButton.onclick = () => {
    notificationsTheme = notificationsTheme === "light" ? "dark" : "light";
    updateFromTheme();
    chrome.storage.local.set({ "notificationsTheme": notificationsTheme });
  };

  // Load notifications on scroll
  notificationsSection.addEventListener("scroll", checkScroll, { passive: true });
  function checkScroll() {
    if(notLoading && Math.abs(notificationsSection.scrollHeight - notificationsSection.scrollTop - notificationsSection.clientHeight) <= 76) {
      notLoading = false;
      getNextNotifications();
    }
  }

  markAllRead.onclick = () => {
    markReadLoading.style.display = "inline-block";
    markAllRead.disabled = true;
    clearNotifications().then(() => {
      markReadLoading.style.display = "none";
      markAllRead.disabled = false;
      chrome.action.setBadgeText({
        text: ""
      });
    })
    .catch((error) => {
      markReadLoading.style.display = "none";
      console.error(error);
    });
  };

}