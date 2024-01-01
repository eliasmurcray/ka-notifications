import "../css/popup.css";

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
