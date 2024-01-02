import { khanApiFetch, getAuthToken } from "../utils/khan-api";

const ALARM_NAME = "KHAN_ACADEMY_NOTIFICATIONS";

// Authentication status monitoring
chrome.cookies.onChanged.addListener(async ({ cookie, removed }) => {
	if (cookie.name === "KAAS") {
		chrome.action.setBadgeText({ text: "" });
		if (removed) {
			// Logged out
			chrome.alarms.clear(ALARM_NAME);
			chrome.storage.local.remove(["prefetchCursor"]);
			chrome.storage.local.set({
				prefetchData: "$logged_out",
			});
		} else {
			// Logged in
			if (await chrome.alarms.get(ALARM_NAME)) return;
			chrome.alarms.create(ALARM_NAME, {
				periodInMinutes: 1,
			});
			chrome.storage.local.remove(["prefetchCursor", "prefetchData"]);
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

chrome.storage.local.remove(["prefetch_cursor", "prefetch_data"]);
refreshNotifications();

// Teal background for notification count badge
chrome.action.setBadgeBackgroundColor({
	color: "#00BFA5",
});

async function refreshNotifications() {
	const token = await getAuthToken();
	if (!token) {
		chrome.action.setBadgeText({ text: "" });
		chrome.storage.local.remove(["cached_cursor"]);
		chrome.storage.local.set({
			cached_data: "$token_expired",
		});
		return;
	}

	try {
		const notificationCountResponse = await khanApiFetch("getFullUserProfile", token);
		const notificationCountJSON = await notificationCountResponse.json();
		const notificationCount = notificationCountJSON?.data?.user?.newNotificationCount;
		if (notificationCount === 0) {
			chrome.action.setBadgeText({
				text: "",
			});
			chrome.storage.local.remove(["prefetchCursor"]);
			chrome.storage.local.set({
				prefetchData: "[]",
			});
			return;
		}

		if (notificationCount === null) {
			chrome.alarms.clear(ALARM_NAME);
			chrome.storage.local.remove(["prefetchCursor"]);
			chrome.storage.local.set({
				prefetchData: "$logged_out",
			});
			return;
		}

		const notificationsResponse = await khanApiFetch("getNotificationsForUser", token);
		const notificationsJSON = await notificationsResponse.json();
		const notifications = notificationsJSON?.data?.user?.notifications;
		if (!notifications) {
			chrome.action.setBadgeText({
				text: "",
			});
			chrome.storage.local.remove(["prefetchCursor"]);
			chrome.storage.local.set({
				prefetchData: "[]",
			});
			return;
		}

		chrome.storage.local.set({
			prefetchData: notifications.notifications,
			prefetchCursor: notifications.pageInfo.nextCursor,
		});

		chrome.action.setBadgeText({
			text: notificationCount > 98 ? "99+" : notificationCount.toString(),
		});
	} catch (err) {
		if (err instanceof Error && err.message === "Failed to fetch") {
			console.warn(
				"Possible network disconnect detected, please check your internet connection.",
			);
		} else {
			console.error(err);
		}
	}
}
