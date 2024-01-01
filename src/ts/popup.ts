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
let __global_cursor = "";
chrome.storage.local.get(
	["prefetch_cursor", "prefetch_data"],
	({ prefetch_cursor, prefetch_data }) => {
		__global_cursor = prefetch_cursor;
		switch (prefetch_data) {
			case "$logged_out":
				break;
			case "$token_expired":
				break;
			case undefined:
				break;
			default:
				if (!Array.isArray(prefetch_data)) return;
				if (prefetch_data.length === 0) {
					console.log("No notifications");
					return;
				}
				notificationsContainer.innerHTML = prefetch_data
					.map(createNotificationString)
					.join("");
				setTimeout(addReplyButtonEventListeners, 1000);
		}
	},
);
