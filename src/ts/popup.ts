import { getAuthToken, khanApiFetch } from "../util/khan-api";
import { createNotificationString, addReplyButtonEventListeners } from "../util/notification-utils";
import "../css/popup.css";

// Page switching
const settingsSection = document.getElementById("settings-section") as HTMLDivElement;
const notificationsSection = document.getElementById("notifications-section") as HTMLDivElement;
const pageButton = document.getElementById("page-button") as HTMLButtonElement;
const settingsIcon = document.getElementById("settings-icon") as HTMLElement & SVGElement;
const backIcon = document.getElementById("back-icon") as HTMLElement & SVGElement;
pageButton.onclick = () => {
	notificationsSection.classList.toggle("hidden");
	settingsSection.classList.toggle("hidden");
	settingsIcon.classList.toggle("hidden");
	backIcon.classList.toggle("hidden");
};

// Notifications from local storage
const notificationsContainer = document.getElementById("notifications-container") as HTMLDivElement;
const loadingSpinner = document.getElementById("loading-spinner-container") as HTMLDivElement;
let __global_cursor__ = "";
let __loading_notifications__ = false;
chrome.storage.local.get(["prefetchCursor", "prefetchData"], ({ prefetchCursor, prefetchData }) => {
	__global_cursor__ = prefetchCursor ?? "";
	switch (prefetchData) {
		case "$logged_out":
			notificationsContainer.innerHTML =
				'<li class="notification new"><div class="notification-header"><img class="notification-author-avatar" src="32.png"><h3 class="notification-author-nickname">KA Notifications</h3></div><div class="notification-content">You are logged out. Please <a class="hyperlink" href="https://khanacademy.org/login" target="_blank">log in to Khan Academy</a> to use this extension.</div></li>';
			loadingSpinner.remove();
			return;
		case "$token_expired":
			notificationsContainer.innerHTML =
				'<li class="notification new"><div class="notification-header"><img class="notification-author-avatar" src="32.png"><h3 class="notification-author-nickname">KA Notifications</h3></div><div class="notification-content">Your authentication cookie has expired. Please <a class="hyperlink" href="https://khanacademy.org/" target="_blank">navigate to Khan Academy</a> to refresh it.</div></li>';
			loadingSpinner.remove();
			return;
		case undefined:
			break;
		default:
			if (!Array.isArray(prefetchData)) break;
			if (prefetchData.length === 0) {
				notificationsContainer.innerHTML =
					'<li class="notification new"><div class="notification-header"><img class="notification-author-avatar" src="32.png"><h3 class="notification-author-nickname">KA Notifications</h3></div><div class="notification-content">You have no notifications.</div></li>';
				return;
			}
			notificationsContainer.innerHTML = prefetchData.map(createNotificationString).join("");
			addReplyButtonEventListeners();
	}

	notificationsSection.onscroll = handleScroll;
});

function handleScroll(): void {
	if (
		!__loading_notifications__ &&
		Math.abs(
			notificationsSection.scrollHeight -
				notificationsSection.scrollTop -
				notificationsSection.clientHeight,
		) < 77
	) {
		__loading_notifications__ = true;
		loadNotifications();
	}
}

async function loadNotifications(): Promise<void> {
	const token = await getAuthToken();
	if (!token) {
		notificationsContainer.innerHTML =
			'<li class="notification new"><div class="notification-header"><img class="notification-author-avatar" src="32.png"><h3 class="notification-author-nickname">KA Notifications</h3></div><div class="notification-content">You are logged out. Please <a class="hyperlink" href="https://khanacademy.org/login" target="_blank">log in to Khan Academy</a> to use this extension.</div></li>';
		notificationsSection.onscroll = null;
		loadingSpinner.remove();
		return;
	}
	try {
		const notificationsResponse = await khanApiFetch("getNotificationsForUser", token, {
			after: __global_cursor__ || "",
		});
		const notificationsJSON = await notificationsResponse.json();
		const notifications = notificationsJSON?.data?.user?.notifications;
		if (!notifications) {
			notificationsContainer.innerHTML =
				'<li class="notification new"><div class="notification-header"><img class="notification-author-avatar" src="32.png"><h3 class="notification-author-nickname">KA Notifications</h3></div><div class="notification-content">You have no notifications.</div></li>';
			notificationsSection.onscroll = null;
			loadingSpinner.remove();
			return;
		}

		notificationsContainer.innerHTML += notifications.notifications
			.map(createNotificationString)
			.join("");

		if (notifications.pageInfo?.nextCursor === null) {
			notificationsSection.onscroll = null;
			loadingSpinner.remove();
		} else {
			__global_cursor__ = notifications.pageInfo.nextCursor;
			__loading_notifications__ = false;
		}
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
