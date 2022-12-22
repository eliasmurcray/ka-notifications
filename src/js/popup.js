import queries from "../graphql-queries.json";
import "../css/popup.css";

// Restore the state of the popup window from chrome.storage when it is opened
const storedState = (await chrome.storage.local.get("popupState"))?.popupState;
if(storedState)
  document.body.innerHTML = storedState;

const storedCursor = (await chrome.storage.local.get("notificationsCursor"))?.notificationsCursor;
let notificationsGenerator = createNotificationsGenerator(storedCursor ?? "");
const notificationsContainer = document.getElementById("notifications-container");

getNextNotifications();

notificationsContainer.addEventListener("scroll", () => {
  if(notificationsContainer.scrollHeight - notificationsContainer.scrollTop - notificationsContainer.clientHeight > 250)
    getNextNotifications();
}, {
  passive: true
});

async function getNextNotifications() {
  // If we have new notifications, refresh notification page
  if(+(await chrome.storage.local.get("newNotificationCount").newNotificationCount) > 0)
    notificationsGenerator = createNotificationsGenerator();
  notificationsGenerator.next().then(({ value: notifications }) => {
    if(notifications === undefined) return;
    var elementString = "";
    notifications.forEach(({ authorAvatarSrc, authorAvatarUrl, authorNickname, content, read, date }) => {
      elementString += `<li class="notification${read ? " read" : ""}"><div class="notification-header"><img class="notification-author--avatar" src="${authorAvatarSrc ?? authorAvatarUrl}"><h3 class="notification-author--nickname">${clean(authorNickname)}</h3><span class="notification-date">${timeSince(new Date(date))} ago</span></div><p class="notification-content">${clean(content)}</p></li>`;
    });
    notificationsContainer.innerHTML += elementString;
    chrome.storage.local.set({ "popupState": document.body.innerHTML });
  });
}

function clean(text) {
  return text.replace(/</gm, "&lt;").replace(/>/gm, "&gt;");
}

// Returns generator function that gets user notifications
async function* createNotificationsGenerator(cursor = "") {
  let complete = false;
  for(;!complete;) {
    // Retrieve user notifications as JSON
    const json = (await graphQLFetch("getNotificationsForUser", await getChromeFkey(), { after: cursor })).data.user.notifications;

    // Retrieve a cursor from the JSON
    const nextCursor = json.pageInfo.nextCursor;

    // Update loop control variables
    complete = !nextCursor;
    cursor = nextCursor ?? "";

    // chrome.storage Update cursor value
    chrome.storage.local.set({ "notificationsCursor": cursor });

    // Return this set of notifications as JSON
    yield json.notifications;
  }
}

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
      if (cookie === null || !cookie) reject("fkey cookie not found.");
      resolve(cookie?.value);
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
  return ~~interval + (~~interval > 1 ? " seconds" : " second");
}