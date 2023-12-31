import { khanApiFetch } from "../util/khan-api.ts";

const ALARM_NAME = "KHAN_ACADEMY_NOTIFICATIONS";

// Authentication status monitoring
chrome.cookies.onChanged.addListener(({ cookie, removed }) => {
  if (cookie.name === "KAAS") {
    chrome.action.setBadgeText({ text: "" });
    if (removed) {
      // Logged out
      chrome.storage.local.remove(["prefetch_cursor"]);
      chrome.storage.local.set({
        prefetch_data: "$logged_out",
      });
    } else {
      // Logged in
      chrome.storage.local.remove(["prefetch_cursor", "prefetch_data"]);
      refreshNotifications();
    }
  }
});

// Refresh notifications every minute
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    refreshNotifications();
  }
});

chrome.alarms.clear(ALARM_NAME);

chrome.alarms.create(ALARM_NAME, {
  periodInMinutes: 1,
});

// Teal background for notification count badge
chrome.action.setBadgeBackgroundColor({
  color: "#00BFA5",
});

async function refreshNotifications() {
  const token = await getAuthToken();
  if (!token) {
    chrome.action.setBadgeText({ text: "" });
    chrome.storage.local.set({
      cached_data: "$logged_out",
      cached_cursor: "",
    });
    return;
  }

  try {
    const notificationCountResponse = await khanApiFetch("getFullUserProfile", token);
    const notificationCountJSON = await notificationCountResponse.json();
    const notificationCount = notificationCountJson?.data?.user?.newNotificationCount;
    if (notificationCount === 0) {
      chrome.action.setBadgeText({
        text: "",
      });
      return;
    }

    if (!notificationCount) {
      throw new Error(
        "Notification count is undefined in: " + JSON.stringify(notificationCountJSON),
      );
    }

    const notificationsResponse = await khanApiFetch("getNotificationsForUser", token);
    const notificationsJSON = await notificationsResponse.json();
    const notifications = notificationsJSON.value?.data?.user?.notifications;
    if (!notifications) {
      chrome.action.setBadgeText({
        text: "",
      });
      chrome.storage.local.remove(["cached_cursor"]);
      chrome.storage.local.set({
        cached_data: "{}",
      });
    }

    if (notificationCount > 0) {
      chrome.action.setBadgeText({
        text: notificationCount > 98 ? "99+" : notificationCount.toString(),
      });
    }
  } catch (err) {
    console.error(err);
  }
}
