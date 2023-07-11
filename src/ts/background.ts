import {
  createOffscreenHeartbeat,
  getNotificationCount,
  getNotificationData,
} from "../util/background";
import { getUserKaasCookie, graphQLFetch } from "../util/graphql";
const ALARM_NAME = "khanAcademyNotifications";

/*
	Event Listeners
 */

void chrome.runtime.onInstalled.addListener(createOffscreenHeartbeat);

// Recieves heartbeat and keeps service worker alive
void chrome.runtime.onMessage.addListener((message: { keepAlive: boolean }) => {
  if (message.keepAlive === true) {
    1 + 1;
  }
});

// Listens to logout via auth cookie changes
void chrome.cookies.onChanged.addListener(
  async ({ cookie: { name }, removed }) => {
    if (name === "KAAS") {
      void chrome.action.setBadgeText({ text: "" });
      void chrome.storage.local.remove(["prefetch_data", "prefetch_cursor"]);
      // If it was a login, check for notifications immediately
      if (removed === false) {
        console.log("Logged in!");
        void handleNotifications();
      }
    }
  }
);

void chrome.alarms.onAlarm.addListener(async ({ name }) => {
  if (name === ALARM_NAME) {
    void handleNotifications();
  }
});

/*
	Start Extension
*/

// Set background color of badge to teal
void chrome.action.setBadgeBackgroundColor({
  color: "#00BFA5",
});

void chrome.alarms.clear(ALARM_NAME);

void chrome.alarms.create(ALARM_NAME, {
  periodInMinutes: 1,
});

// Initial fetch of notifications
void handleNotifications();

async function handleNotifications(): Promise<void> {
  const perf = performance.now();
  let cookie: string;
  try {
    cookie = await getUserKaasCookie();
  } catch (e) {
    console.log("User is not logged in.");
    return;
  }

  const notificationCount = await getNotificationCount(cookie);

  void chrome.action.setBadgeText({ text: notificationCount.value.toString() });

  const notificationData = await getNotificationData(cookie);

  // If everything works perfectly, use the data
  if (notificationData.error === undefined) {
    console.log(
      `Notifications (${(performance.now() - perf).toFixed(3)}ms): `,
      notificationData.value.notifications
    );
    void chrome.storage.local.set({
      prefetch_data: notificationData.value.notifications,
      prefetch_cursor: notificationData.value.cursor,
    });
    return;
  }

  switch (notificationData.error) {
    case "cookie":
      // User is logged out
      console.log("User is not logged in.");
      void chrome.action.setBadgeText({ text: "" });
      void chrome.storage.local.set({
        cached_data: "<div>You are logged out!</div>",
        cached_cursor: "",
      });
      break;
    case "response":
      // This is the only real error
      console.error("Error in response: ", notificationData.value);
      break;
    case "network":
      // In case of possible disconnect mid-fetch
      console.log(
        "Possible network disconnect detected, please check your internet connection."
      );
      break;
    case "no notifications":
      // User has no notifications
      console.log("User has no notifications.");
      void chrome.action.setBadgeText({ text: "" });
      void chrome.storage.local.remove(["prefetch_data", "prefetch_cursor"]);
      break;
  }
}
