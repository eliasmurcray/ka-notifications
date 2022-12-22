import queries from "../graphql-queries.json";

// Clear our storage variables on extension download (this script initializes only once)
chrome.storage.local.remove(["popupState", "notificationsCursor", "newNotificationCount"]);

const ALARM_NAME = "ka-notification";
chrome.alarms.onAlarm.addListener(({ name }) => {
  if (name === ALARM_NAME) checkForNewNotifications();
});

// Initialize alarm on install
chrome.runtime.onInstalled.addListener(() => {

  // Set background color of badge to teal
  chrome.action.setBadgeBackgroundColor({
    color: "#00BFA5"
  });

  // Check if alarm already exists
  chrome.alarms.get(ALARM_NAME, (alarm) => {
    if(!alarm) {
      checkForNewNotifications();

      // For a faster timer, use window.setInterval
      chrome.alarms.create(ALARM_NAME, {
        periodInMinutes: 1
      });
    }
  });
});

function checkForNewNotifications() {
  fetchUserData().then(({ newNotificationCount }) => {
    chrome.storage.local.set({ "newNotificationCount": newNotificationCount });
    chrome.action.setBadgeText({
      text: newNotificationCount === 0 ? "" : newNotificationCount > 9 ? "9+" : String(newNotificationCount)
    });
  }).catch(console.error);
}

function fetchUserData() {
  return getChromeFkey().then((fkey) => graphQLFetch("getFullUserProfile", fkey));
}

function graphQLFetch(query, fkey) {
  return new Promise((resolve, reject) => {
    fetch("https://www.khanacademy.org/api/internal/graphql/_mt/" + query, {
      method: "POST",
      headers: {
        "X-KA-fkey": fkey,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        operationName: query,
        query: queries[query]
      }),
      credentials: "same-origin"
    }).then(async (response) => {
      if (response.status === 200) return resolve((await response.json()).data.user);
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