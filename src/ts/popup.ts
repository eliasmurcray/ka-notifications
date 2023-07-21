import { KaNotification } from "../@types/notification";
import "../css/popup.css";
import { getNotificationData } from "../util/background";
import { addReplyButtonEventListeners, createLoggedOutString, createNoCookieString, createNoNotificationsString, createNotificationString, initUserInterface } from "../util/popup";

const NOTIFICATIONS_CONTAINER = document.getElementById("notifications-container") as HTMLDivElement;
const RAINBOW_HEADER = document.getElementById("rainbow-header") as HTMLDivElement;
let loading = false,
  localCursor: string;

// Initialize notifications
void chrome.storage.local
  .get(["prefetch_data", "prefetch_cursor", "theme"])
  .then(async ({ prefetch_data, prefetch_cursor, theme }) => {
    initUserInterface(theme);
    if (prefetch_data) {
      switch (prefetch_data) {
        case "info:cookie":
          NOTIFICATIONS_CONTAINER.innerHTML = createNoCookieString();
          document.getElementById("loading-spinner-container")?.remove();
          break;
        case "info:logout":
          NOTIFICATIONS_CONTAINER.innerHTML = createLoggedOutString();
          document.getElementById("loading-spinner-container")?.remove();
          break;
        case "info:nonotifications":
          NOTIFICATIONS_CONTAINER.innerHTML = createNoNotificationsString();
          document.getElementById("loading-spinner-container")?.remove();
          break;
        default:
          let notifications = prefetch_data as KaNotification[];

          if (notifications === undefined) {
            return;
          }

          NOTIFICATIONS_CONTAINER.innerHTML = notifications.map(createNotificationString).join("");
          addReplyButtonEventListeners();

          if (prefetch_cursor === undefined) {
            return;
          }

          localCursor = prefetch_cursor;
          // Add scroll listener, since there are notifications
          document.body.addEventListener("scroll", handleScroll, { passive: true });
      }
      RAINBOW_HEADER.classList.add("stopped");
    } else {
      await appendNotifications();
      document.body.addEventListener("scroll", handleScroll, { passive: true });
    }
  })
  .catch((error) => {
    console.log(error);
  });

function handleScroll() {
  if (loading === false && Math.abs(document.body.scrollHeight - document.body.scrollTop - document.body.clientHeight) <= 76) {
    loading = true;
    appendNotifications();
  }
}

let firstTime = true;
async function appendNotifications(): Promise<void> {
  RAINBOW_HEADER.classList.remove("stopped");
  const response = await getNotificationData(undefined, localCursor);

  if (response.value !== undefined) {
    const { notifications, cursor } = response.value;

    NOTIFICATIONS_CONTAINER.insertAdjacentHTML("beforeend", notifications.map(createNotificationString).join(""));
    addReplyButtonEventListeners();

    if (cursor === null) {
      document.getElementById("loading-spinner-container")?.remove();
      document.body.removeEventListener("scroll", handleScroll);
    }
    localCursor = cursor;
    loading = false;
    RAINBOW_HEADER.classList.add("stopped");
  } else {
    RAINBOW_HEADER.classList.add("stopped");
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
        document.body.removeEventListener("scroll", handleScroll);
        break;
    }
  }

  firstTime = false;
}

/**
 * Set up refresh button
 */

const refreshButton = document.getElementById("refresh-notifications");
refreshButton.onclick = async () => {
  NOTIFICATIONS_CONTAINER.innerHTML = "";
  RAINBOW_HEADER.classList.remove("stopped");
  document.body.removeEventListener("scroll", handleScroll);
  localCursor = "";
  await appendNotifications();
};
