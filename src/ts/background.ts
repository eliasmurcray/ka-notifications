import QUERIES from "../graphql-queries.json";

// Set background color of badge to teal
chrome.action.setBadgeBackgroundColor({
  color: "#00BFA5"
});

// Remove old storage elements to start fresh
chrome.storage.local.remove(["newNotifications", "notificationsTheme"]);

// Add event listener to user logout sessions
chrome.cookies.onChanged.addListener(({ cookie, removed }) => {
  if(cookie.name === "KAAS")
    if(removed === true) {
      chrome.action.setBadgeText({ text: "!" });
    } else {
      chrome.action.setBadgeText({ text: "" });
      checkForNewNotifications();
    }
});

const ALARM_NAME: string = "khanAcademyNotifications";

// When alarm "khanAcademyNotifications" goes off, check for new notifications
chrome.alarms.onAlarm.addListener(({ name }) => {
  if(name === ALARM_NAME) checkForNewNotifications();
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
    .then(({ data: { user } }) => {
      // If user is not logged in show an error
      if(user === null)
        return chrome.action.setBadgeText({ text: "!" });
      
      // Or else, update notification count
      const { newNotificationCount } = user;
      chrome.storage.local.set({ "newNotifications": newNotificationCount > 0 });
      chrome.action.setBadgeText({
        text: newNotificationCount === 0 ? "" : newNotificationCount > 99 ? "99+" : String(newNotificationCount)
      });
    })
    .catch((error) => {
      chrome.action.setBadgeText({ text: "!" });
      console.error(error);
    });
}

function graphQLFetch(query: string, fkey: string, variables: { [key:string]: any } = {}): Promise<{ [key: string]: any }> {
  return new Promise((resolve, reject) => {
    fetch("https://www.khanacademy.org/api/internal/graphql/" + query + "?/math/", {
      method: "POST",
      headers: {
        "X-KA-fkey": fkey,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        operationName: query,
        query: QUERIES[query],
        variables
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