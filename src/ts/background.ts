import {
  createOffscreenHeartbeat,
  getNotificationCount,
  getNotificationData,
} from "../util/background";
import { getUserFkeyCookie } from "../util/graphql";
const ALARM_NAME = "khanAcademyNotifications";

/*
	Event Listeners
 */

chrome.runtime.onInstalled.addListener(createOffscreenHeartbeat);

// Recieves heartbeat and keeps service worker alive
chrome.runtime.onMessage.addListener((message) => {
  if (message.keepAlive) {
    1 + 1;
  }
  return false;
});

// Listens to logout via auth cookie changes
chrome.cookies.onChanged.addListener(async ({ cookie: { name }, removed }) => {
  if (name === "KAAS") {
    chrome.action.setBadgeText({ text: "" });

    // If it was a login, check for notifications immediately
    if (!removed) {
      console.log("Logged in!");
      chrome.storage.local.remove(["prefetchCursor", "prefetchData"]);
      handleNotifications();
    } else {
      console.log("Logged out!");
      chrome.storage.local.remove(["prefetchCursor"]);
      chrome.storage.local.set({ prefetchData: "info:logout" });
    }
  }
});

chrome.alarms.onAlarm.addListener(async ({ name }) => {
  if (name === ALARM_NAME) {
    handleNotifications();
  }
});

/*
	Start Extension
*/
chrome.storage.local.remove(["prefetchCursor", "prefetchData", "commentSort"]);

// Set background color of badge to teal
chrome.action.setBadgeBackgroundColor({
  color: "#00BFA5",
});

chrome.alarms.clear(ALARM_NAME);

chrome.alarms.create(ALARM_NAME, {
  periodInMinutes: 1,
});

// Initial fetch of notifications
handleNotifications();

async function handleNotifications(): Promise<void> {
  const perf = performance.now();

  let cookie: string;
  try {
    cookie = await getUserFkeyCookie();
  } catch (e) {
    chrome.action.setBadgeText({ text: "" });
    chrome.storage.local.set({
      cached_data: "info:logout",
      cached_cursor: "",
    });
    return;
  }

  const notificationCount = await getNotificationCount(cookie);

  if (!notificationCount) {
    return;
  }

  if (notificationCount.value === 0) {
    chrome.action.setBadgeText({ text: "" });
  }

  if (notificationCount.error === "!user") {
    console.log("No user found: ", notificationCount.value);
    return;
  }

  const notificationData = await getNotificationData(cookie);

  if (!notificationData) {
    return;
  }

  // No notifications
  if (notificationData.error === "nonotifications") {
    chrome.action.setBadgeText({ text: "" });
    chrome.storage.local.remove("prefetchCursor");
    chrome.storage.local.set({
      prefetchData: "info:nonotifications",
    });
  }

  // If everything works perfectly, use the data
  if (notificationData.error === undefined) {
    console.log(
      `Notifications (${(performance.now() - perf).toFixed(3)}ms): `,
      notificationData.value?.notifications,
    );
    chrome.storage.local.set({
      prefetchData: notificationData.value?.notifications,
      prefetchCursor: notificationData.value?.cursor,
    });

    if (notificationCount.value !== 0) {
      chrome.action.setBadgeText({
        text: (notificationCount.value! > 98
          ? "99+"
          : notificationCount.value?.toString()) as string,
      });
    }
  }
}
