const ALARM_NAME = "KHAN_ACADEMY_NOTIFICATIONS";

// Authentication status monitoring
chrome.cookies.onChanged.addListener(({ cookie, removed }) => {
	if (cookie.name === "KAAS") {
		chrome.action.setBadgeText({ text: "" });
		if (removed) {
			console.log("Logged out.");
		} else {
			console.log("Logged in.");
		}
	}
});

// Poll for notifications every minute
chrome.alarms.onAlarm.addListener((alarm) => {
	if (alarm.name === ALARM_NAME) {
		console.log("Alarm activated");
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
