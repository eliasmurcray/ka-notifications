import { KaNotification } from "../@types/notification";
import "../css/popup.css";
import createNotificationString from "../util/popup";

const NOTIFICATIONS_CONTAINER = document.getElementById("notifications-container") as HTMLDivElement;

void chrome.storage.local
  .get(["prefetch_data", "prefetch_cursor"])
  .then(({ prefetch_data, prefetch_cursor }) => {
    if (prefetch_data && prefetch_cursor) {
      let notifications = prefetch_data as KaNotification[];
      console.log(notifications);
      if (!notifications) {
        return;
      }

      NOTIFICATIONS_CONTAINER.innerHTML = notifications.map(createNotificationString).join("");
    }
  })
  .catch((error) => {
    console.log(error);
  });
