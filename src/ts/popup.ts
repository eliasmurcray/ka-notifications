import { KaNotification } from "../@types/notification";
import "../css/popup.css";
import { getNotificationData } from "../util/background";
import { createLoggedOutString, createNoCookieString, createNoNotificationsString, createNotificationString } from "../util/popup";

const NOTIFICATIONS_CONTAINER = document.getElementById("notifications-container") as HTMLDivElement;
let loading = false,
  localCursor: string;

// Initialize notifications
void chrome.storage.local
  .get(["prefetch_data", "prefetch_cursor"])
  .then(async ({ prefetch_data, prefetch_cursor }) => {
    if (prefetch_data) {
      if (prefetch_data === "info:cookie") {
        NOTIFICATIONS_CONTAINER.innerHTML = createNoCookieString();
        document.getElementById("loading-spinner-container")?.remove();
      } else if (prefetch_data === "info:logout") {
        NOTIFICATIONS_CONTAINER.innerHTML = createLoggedOutString();
        document.getElementById("loading-spinner-container")?.remove();
      } else if (prefetch_data === "info:nonotifications") {
        NOTIFICATIONS_CONTAINER.innerHTML = createNoNotificationsString();
        document.getElementById("loading-spinner-container")?.remove();
      }

      let notifications = prefetch_data as KaNotification[];

      if (notifications === undefined) {
        return;
      }

      NOTIFICATIONS_CONTAINER.innerHTML = notifications.map(createNotificationString).join("");

      if (prefetch_cursor === undefined) {
        return;
      }

      localCursor = prefetch_cursor;
      // Add scroll listener, since there are notifications
      window.addEventListener("scroll", handleScroll, { passive: true });

      return;
    } else {
      await appendNotifications();
      window.addEventListener("scroll", handleScroll, { passive: true });
    }
  })
  .catch((error) => {
    console.log(error);
  });

function handleScroll() {
  if (loading === false && Math.abs(document.documentElement.scrollHeight - document.documentElement.scrollTop - document.documentElement.clientHeight) <= 76) {
    loading = true;
    appendNotifications();
  }
}

let firstTime = true;
async function appendNotifications(): Promise<void> {
  const response = await getNotificationData(undefined, localCursor);

  if (response.value !== undefined) {
    const { notifications, cursor } = response.value;

    NOTIFICATIONS_CONTAINER.innerHTML += notifications.map(createNotificationString).join("");

    if (cursor === null) {
      document.getElementById("loading-spinner-container")?.remove();
      window.removeEventListener("scroll", handleScroll);
    }
    localCursor = cursor;
    loading = false;
  } else {
    document.getElementById("loading-spinner-container")?.remove();

    if (firstTime === true && response.error === "cookie") {
      NOTIFICATIONS_CONTAINER.innerHTML = createLoggedOutString();
      firstTime = false;
      return;
    }

    switch (response.error) {
      case "cookie":
        NOTIFICATIONS_CONTAINER.innerHTML = createNoCookieString();
        break;
      case "nonotifications":
        window.removeEventListener("scroll", handleScroll);
        break;
    }
  }

  firstTime = false;
}
