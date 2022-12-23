import queries from "../graphql-queries.json";
import "../css/popup.css";

// Restore the state of the popup window from chrome.storage when it is opened
const storedState = (await chrome.storage.local.get("popupState"))?.popupState;
if(storedState) document.body.innerHTML = storedState;

// Retrieve the last notifications cursor and update from there
const storedCursor = (await chrome.storage.local.get("notificationsCursor"))?.notificationsCursor;
let notificationsGenerator = createNotificationsGenerator(storedCursor ?? "");
const notificationsContainer = document.getElementById("notifications-container");
if(!storedCursor)
  getNextNotifications();
const notificationsSection = document.getElementById("notifications-section");
const loadingContainer = document.getElementById("loading-container");

// Add theme changer
let notificationsTheme = (await chrome.storage.local.get("notificationsTheme"))?.notificationsTheme ?? "light";
const themeButton = document.getElementById("theme-button");
updateFromTheme();
themeButton.onclick = () => {
  notificationsTheme = notificationsTheme === "light" ? "dark" : "light";
  updateFromTheme();
  chrome.storage.local.set({ "notificationsTheme": notificationsTheme });
};

function updateFromTheme() {
  if(notificationsTheme === "light") {
    themeButton.innerHTML = '<svg stroke="#ffffff" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="18px" width="18px" xmlns="http://www.w3.org/2000/svg"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
    document.body.className = "light";
  } else {
    themeButton.innerHTML = '<svg stroke="#ffffff" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="18px" width="18px" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
    document.body.className = "dark";
  }
}

// Add scroll listener
let notLoading = true;
notificationsSection.addEventListener("scroll", checkScroll, { passive: true });
function checkScroll() {
  if(notLoading && Math.abs(notificationsSection.scrollHeight - notificationsSection.scrollTop - notificationsSection.clientHeight) <= 76) {
    notLoading = false;
    getNextNotifications();
  }
}

// Add mark all as read button
const markAllRead = document.getElementById("mark-all-read");
const markReadLoading = document.getElementById("mark-read-loading");
markAllRead.onclick = () => {
  markReadLoading.style.display = "inline-block";
  markAllRead.disabled = true;
  clearNotifications().then(() => {
    markReadLoading.style.display = "none";
    markAllRead.disabled = false;
    chrome.action.setBadgeText({
      text: ""
    });
  });
};

async function getNextNotifications() {
  // If we have new notifications, refresh notification page
  if(+(await chrome.storage.local.get("newNotificationCount").newNotificationCount) > 0) {
    notificationsGenerator = createNotificationsGenerator();
    await chrome.storage.local.set({ "newNotificationCount" : 0 });
  }

  notificationsGenerator.next().then(({ value: notifications }) => {
    if(notifications === null) return loggedOutError();
    var elementString = "";
    for(let i = 0, len = notifications.length; i < len; i++) {
      const notification = notifications[i];
      elementString += createNotificationString(notification);
    }
    notificationsContainer.innerHTML += elementString;
    notLoading = true;
    chrome.storage.local.set({ "popupState": document.body.innerHTML });
  });
}

function createNotificationString(notification) {
  switch(notification.__typename) {
    case "ResponseFeedbackNotification": {
      const { authorAvatarUrl, authorNickname, brandNew, content, date, focusTranslatedTitle, url } = notification;
      return `<li class="notification ${brandNew ? " unread" : ""}"><div class="notification-header"><img class="notification-author--avatar" src="${authorAvatarUrl}"><h3 class="notification-author--nickname">${escapeHTML(authorNickname)}</h3><a class="hyperlink" href="https://www.khanacademy.org${url}" target="_blank">commented on ${focusTranslatedTitle}</a><span class="notification-date">${timeSince(new Date(date))} ago</span></div><p class="notification-content">${escapeHTML(content)}</p></li>`;
    }
    break;
    case "ProgramFeedbackNotification": {
      const { authorAvatarSrc, authorNickname, brandNew, content, date, translatedScratchpadTitle, url } = notification;
      return `<li class="notification ${brandNew ? " unread" : ""}"><div class="notification-header"><img class="notification-author--avatar" src="${authorAvatarSrc}"><h3 class="notification-author--nickname">${escapeHTML(authorNickname)}</h3><a class="hyperlink" href="https://www.khanacademy.org${url}" target="_blank">left feedback on ${translatedScratchpadTitle}</a><span class="notification-date">${timeSince(new Date(date))} ago</span></div><p class="notification-content">${escapeHTML(content)}</p></li>`;
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

// Gets text ready to be appended to innerHTML
function escapeHTML(text) {
  return text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Returns generator function that gets user notifications
async function* createNotificationsGenerator(cursor = "") {
  let complete = false;
  for(;!complete;) {
    // Retrieve user notifications as JSON
    const json = (await graphQLFetch("getNotificationsForUser", await getChromeFkey(), { after: cursor }))?.data?.user?.notifications;

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
    } else
      yield null;
  }
}

function clearNotifications() {
  return new Promise((resolve, reject) => {
    getChromeFkey().then((fkey) => {
      graphQLFetch("clearBrandNewNotifications", fkey)
      .then(resolve)
      .catch(reject);
    }).catch(console.error)
  });
}

// This function accepts an fkey and variables to
function graphQLFetch(query, fkey, variables = {}) {
  return new Promise((resolve, reject) => {
    fetch("https://www.khanacademy.org/api/internal/graphql/_mt/" + query, {
      method: "POST",
      headers: {
        "X-KA-fkey": fkey,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        operationName: query,
        query: queries[query],
        variables
      }),
      credentials: "same-origin"
    }).then(async (response) => {
      if (response.status === 200) return resolve(await response.json());
      response.text().then((body) => reject(`Error in GraphQL ${query} call: Server responded with status ${JSON.stringify(response.status)} and body ${JSON.stringify(body)}`));
    });
  });
}

function getChromeFkey() {
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

function timeSince(date) {

  var seconds = Math.floor((new Date() - date) / 1000);

  var interval = seconds / 31536000;

  if (interval > 1) {
    return ~~interval + (~~interval > 1 ? " years" : " year");
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return ~~interval + (~~interval > 1 ? " months" : " month");
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return ~~interval + (~~interval > 1 ? " days" : " day");
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return ~~interval + (~~interval > 1 ? " hours" : " hour");
  }
  interval = seconds / 60;
  if (interval > 1) {
    return ~~interval + (~~interval > 1 ? " minutes" : " minute");
  }
  interval = ~~interval;
  return interval + ((interval > 1 || interval === 0) ? " seconds" : " second");
}

function loggedOutError() {
  loadingContainer.remove();
  notificationsContainer.innerHTML = `<li class="notification unread"><div class="notification-header"><img class="notification-author--avatar" src="32.png"><h3 class="notification-author--nickname">KA Notifications</h3><span class="notification-date">${timeSince(new Date())} ago</span></div><p class="notification-content">You must be <a class="hyperlink" href="https://www.khanacademy.org/login/" target="_blank">logged in</a> to use this extension.</p></li>`;
}