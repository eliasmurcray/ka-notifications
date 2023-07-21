import { createOffscreenHeartbeat, getNotificationCount, getNotificationData } from "../util/background";
import { getUserFkeyCookie } from "../util/graphql";
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
void chrome.cookies.onChanged.addListener(async ({ cookie: { name }, removed }) => {
  if (name === "KAAS") {
    void chrome.action.setBadgeText({ text: "" });

    // If it was a login, check for notifications immediately
    if (removed === false) {
      console.log("Logged in!");
      void chrome.storage.local.remove(["prefetch_cursor", "prefetch_data"]);
      void handleNotifications();
    } else {
      console.log("Logged out!");
      void chrome.storage.local.remove(["prefetch_cursor"]);
      void chrome.storage.local.set({ prefetch_data: "info:logout" });
    }
  }
});

void chrome.alarms.onAlarm.addListener(async ({ name }) => {
  if (name === ALARM_NAME) {
    void handleNotifications();
  }
});

/*
	Start Extension
*/

void chrome.storage.local.remove(["prefetch_cursor", "prefetch_data"]);

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
    cookie = await getUserFkeyCookie();
  } catch (e) {
    void chrome.action.setBadgeText({ text: "" });
    void chrome.storage.local.set({
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
    void chrome.action.setBadgeText({ text: "" });
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
    void chrome.action.setBadgeText({ text: "" });
    void chrome.storage.local.remove("prefetch_cursor");
    void chrome.storage.local.set({
      prefetch_data: "info:nonotifications",
    });
  }

  // If everything works perfectly, use the data
  if (notificationData.error === undefined) {
    console.log(`Notifications (${(performance.now() - perf).toFixed(3)}ms): `, notificationData.value.notifications);
    void chrome.storage.local.set({
      prefetch_data: notificationData.value.notifications,
      prefetch_cursor: notificationData.value.cursor,
    });

    if (notificationCount.value !== 0) {
      void chrome.action.setBadgeText({
        text: notificationCount.value > 98 ? "99+" : notificationCount.value.toString(),
      });
    }
    return;
  }
}
