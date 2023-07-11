import "../css/popup.css";

const NOTIFICATIONS_CONTAINER = document.getElementById(
  "notifications-container"
) as HTMLDivElement;

void chrome.storage.local
  .get(["prefetch_data", "prefetch_cursor"])
  .then(({ prefetch_data, prefetch_cursor }) => {
    if (prefetch_data && prefetch_cursor) {
      console.log(prefetch_data, prefetch_cursor);
    }
  })
  .catch((error) => {
    console.log(error);
  });
