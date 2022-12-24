import QUERIES from "../graphql-queries.json";

// Remove old storage elements to start fresh
chrome.storage.local.remove(["notificationsHtml", "notificationsCursor", "newNotifications", "notificationsTheme"]);

const ALARM_NAME: string = "khanAcademyNotifications";

// When alarm "khanAcademyNotifications" goes off, check for new notifications
chrome.alarms.onAlarm.addListener(({ name }) => {
  if(name === ALARM_NAME) checkForNewNotifications();
});

// Set background color of badge to teal
chrome.action.setBadgeBackgroundColor({
  color: "#00BFA5"
});

chrome.runtime.onInstalled.addListener(() => {
  // Run an initial check
  checkForNewNotifications();

  // Set delay between checks to 1 minute
  chrome.alarms.create(ALARM_NAME, {
    periodInMinutes: 1
  });
});

function checkForNewNotifications(): void {
  getChromeFkey()
    .then((fkey) => graphQLFetch("getFullUserProfile", fkey))
    .then(({ data: { user }}) => {
      // If user is not logged in
      if(user === null) {
        chrome.action.setBadgeText({
          text: "!"
        });
        return;
      }

      const { newNotificationCount } = user;
      console.log(user);
      chrome.storage.local.set({ "newNotifications": newNotificationCount > 0 });
      chrome.action.setBadgeText({
        text: newNotificationCount === 0 ? "" : newNotificationCount > 9 ? "9+" : String(newNotificationCount)
      });
    })
    .catch((error) => {
      chrome.action.setBadgeText({
        text: "!"
      });
      console.error(error);
    });
}

function graphQLFetch(query: string, fkey: string): Promise<{ [key:string]: any }> {
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