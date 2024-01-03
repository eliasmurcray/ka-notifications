import { getAuthToken, khanApiFetch } from "../utils/khan-api";
import {
	createNotificationString,
	addReplyButtonEventListeners,
} from "../utils/notification-utils";
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
chrome.storage.local.get(
	["prefetchCursor", "prefetchData", "preferredTheme", "defaultCommentSort"],
	({ prefetchCursor, prefetchData, preferredTheme, defaultCommentSort }) => {
		__global_cursor__ = prefetchCursor ?? "";
		switch (prefetchData) {
			case "$logged_out":
				notificationsContainer.innerHTML =
					'<li class="notification new"><div class="notification-header"><img class="notification-author-avatar" src="32.png"><h3 class="notification-author-nickname">KA Notifications</h3></div><div class="notification-content">You are logged out. Please <a class="hyperlink" href="https://khanacademy.org/login" target="_blank">log in to Khan Academy</a> to use this extension.</div></li>';
				loadingSpinner.classList.add("hidden");
				return;
			case "$token_expired":
				notificationsContainer.innerHTML =
					'<li class="notification new"><div class="notification-header"><img class="notification-author-avatar" src="32.png"><h3 class="notification-author-nickname">KA Notifications</h3></div><div class="notification-content">Your authentication cookie has expired. Please <a class="hyperlink" href="https://khanacademy.org/" target="_blank">navigate to Khan Academy</a> to refresh it.</div></li>';
				loadingSpinner.classList.add("hidden");
				return;
			case undefined:
				__loading_notifications__ = true;
				loadNotifications();
				break;
			default:
				if (!Array.isArray(prefetchData)) break;
				if (prefetchData.length === 0) {
					notificationsContainer.innerHTML =
						'<li class="notification new"><div class="notification-header"><img class="notification-author-avatar" src="32.png"><h3 class="notification-author-nickname">KA Notifications</h3></div><div class="notification-content">You have no notifications.</div></li>';
					loadingSpinner.classList.add("hidden");
					break;
				}
				notificationsContainer.innerHTML = prefetchData
					.map(createNotificationString)
					.join("");
				addReplyButtonEventListeners();
				notificationsSection.onscroll = handleScroll;
		}

		// Theme switching
		let theme = preferredTheme ?? "light";
		const themeButton = document.getElementById("theme-button") as HTMLButtonElement;
		const lightIcon = document.getElementById("light-icon") as HTMLElement & SVGElement;
		const darkIcon = document.getElementById("dark-icon") as HTMLElement & SVGElement;

		if (theme === "dark") {
			lightIcon.classList.toggle("hidden");
			darkIcon.classList.toggle("hidden");
		}

		document.body.className = theme;

		themeButton.onclick = () => {
			theme = theme === "light" ? "dark" : "light";
			chrome.storage.local.set({
				preferredTheme: theme,
			});
			lightIcon.classList.toggle("hidden");
			darkIcon.classList.toggle("hidden");
			document.body.className = theme;
		};

		// Mark all read
		const markAllRead = document.getElementById("mark-all-read") as HTMLButtonElement;
		const markAllReadLoading = document.getElementById(
			"mark-all-read-loading",
		) as HTMLDivElement;
		let isMarkingRead = false;
		markAllRead.onclick = async () => {
			if (isMarkingRead) return;
			isMarkingRead = true;
			markAllReadLoading.classList.remove("hidden");
			try {
				const token = await getAuthToken();
				if (!token) {
					notificationsContainer.innerHTML =
						'<li class="notification new"><div class="notification-header"><img class="notification-author-avatar" src="32.png"><h3 class="notification-author-nickname">KA Notifications</h3></div><div class="notification-content">Your authentication cookie has expired. Please <a class="hyperlink" href="https://khanacademy.org/" target="_blank">navigate to Khan Academy</a> to refresh it.</div></li>';
					return;
				}

				const clearNotificationsResponse = await khanApiFetch(
					"clearBrandNewNotifications",
					token,
				);
				if (clearNotificationsResponse.ok) {
					isMarkingRead = false;
					markAllReadLoading.classList.add("hidden");
					chrome.action.setBadgeText({
						text: "",
					});
				}
			} catch (err) {
				console.error(err);
			}
		};

		// Clear cache
		const clearNotificationCache = document.getElementById(
			"clear-notification-cache",
		) as HTMLButtonElement;
		let isClearingCache = false;
		let clearingCompleteInterval: number;
		clearNotificationCache.onclick = async () => {
			if (isClearingCache) return;
			if (clearingCompleteInterval) window.clearInterval(clearingCompleteInterval);
			isClearingCache = true;
			clearNotificationCache.innerText = "Clearing cache...";
			notificationsContainer.onscroll = null;
			notificationsContainer.innerHTML = "";
			loadingSpinner.classList.remove("hidden");
			__loading_notifications__ = true;
			__global_cursor__ = "";
			await loadNotifications();
			clearNotificationCache.innerText = "Cache cleared";
			isClearingCache = false;
			clearingCompleteInterval = window.setInterval(() => {
				clearNotificationCache.innerText = "Clear cache";
			}, 4000);
		};

		// Default comment sort
		const commentSort = document.getElementById("sort-comments") as HTMLInputElement;
		commentSort.value = defaultCommentSort ?? "Top Voted";
		commentSort.onchange = () => {
			chrome.storage.local.set({
				defaultCommentSort: commentSort.value,
			});
		};
	},
);

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
		loadingSpinner.classList.add("hidden");
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
			loadingSpinner.classList.add("hidden");
			return;
		}

		notificationsContainer.innerHTML += notifications.notifications
			.map(createNotificationString)
			.join("");
		addReplyButtonEventListeners();

		if (notifications.pageInfo?.nextCursor === null) {
			notificationsSection.onscroll = null;
			loadingSpinner.classList.add("hidden");
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
