import "../css/popup.css";
import { KaNotification } from "../@types/notification";
import { getNotificationData } from "../util/background";
import {
  addReplyButtonEventListeners,
  createLoggedOutString,
  createNoCookieString,
  createNoNotificationsString,
  createNotificationString,
  initUserInterface
} from "../util/popup";

const notificationsContainer = document.querySelector(
  "#notifications-container"
);
const notificationsSection = document.querySelector("#notifications-section");
const loadingSpinnerContainer = document.querySelector(
  "#loading-spinner-container"
);

let loading = false;
let localCursor: string;

async function init() {
  try {
    const {
      prefetchData,
      prefetchCursor,
      theme
    } = await chrome.storage.local.get([
      "prefetchData",
      "prefetchCursor",
      "theme"
    ]);
    initUserInterface(theme);

    if (prefetchData) {
      switch (prefetchData) {
        case "info:cookie":
          notificationsContainer.innerHTML = createNoCookieString();
          loadingSpinnerContainer?.remove();
          break;
        case "info:logout":
          notificationsContainer.innerHTML = createLoggedOutString();
          break;
        case "info:nonotifications":
          notificationsContainer.innerHTML = createNoNotificationsString();
          loadingSpinnerContainer?.remove();
          break;
        default:
          const notifications = prefetchData as KaNotification[];

          if (!notifications) {
            return;
          }

          notificationsContainer.innerHTML = notifications
            .map(createNotificationString)
            .join("");
          addReplyButtonEventListeners();

          if (!prefetchCursor) {
            return;
          }

          localCursor = prefetchCursor;
          notificationsSection.addEventListener("scroll", handleScroll, {
            passive: true
          });
      }
    } else {
      await appendNotifications();
      notificationsSection.addEventListener("scroll", handleScroll, {
        passive: true
      });
    }
  } catch (error) {
    console.error(error);
  }
}

async function appendNotifications(): Promise<void> {
  try {
    const response = await getNotificationData(undefined, localCursor);

    if (!response.value) {
      if (firstTime && response.error === "cookie") {
        notificationsContainer.innerHTML = createLoggedOutString();
        loadingSpinnerContainer?.remove();
        firstTime = false;
        return;
      }

      switch (response.error) {
        case "cookie":
          notificationsContainer.innerHTML = createNoCookieString();
          loadingSpinnerContainer?.remove();
          break;
        case "nonotifications":
          notificationsSection.removeEventListener("scroll", handleScroll);
          loadingSpinnerContainer?.remove();
          break;
      }
    } else {
      const { notifications, cursor } = response.value;
      notificationsContainer.insertAdjacentHTML(
        "beforeend",
        notifications.map(createNotificationString).join("")
      );
      addReplyButtonEventListeners();

      if (cursor === null) {
        notificationsSection.removeEventListener("scroll", handleScroll);
      }
      localCursor = cursor;
      loading = false;
    }
  } catch (error) {
    console.error(error);
  }
}

function handleScroll() {
  if (
    !loading &&
    Math.abs(
      notificationsSection.scrollHeight -
        notificationsSection.scrollTop -
        notificationsSection.clientHeight
    ) <= 76
  ) {
    loading = true;
    appendNotifications();
  }
}

let firstTime = true;
init();
