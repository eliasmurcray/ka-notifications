import { Notification } from "../@types/notification";
import { graphQLFetch, getChromeFkey } from "../util/graphql";
import { createNotificationsGenerator, createNotificationHTMLDivElement, renderFromCache } from "../util/notifications";
import "../css/popup.css";
import { ExtensionLocalStorage } from "../@types/extension";
import { ClearBrandNewNotificationsResponse } from "../@types/responses";

// Retrieve items from local storage
const STORAGE = await chrome.storage.local.get(["notificationsTheme", "notificationsCache"]) as ExtensionLocalStorage;
void chrome.storage.local.remove("notificationsCache");
const THEME: string = STORAGE?.notificationsTheme;
const CACHED_DATA = STORAGE?.notificationsCache;

let notificationsTheme = THEME ?? "light";
const notificationsGenerator: AsyncGenerator<Notification[], Notification[]> = createNotificationsGenerator(CACHED_DATA?.cursor ?? "");

// Retrieve DOM elements
const notificationsSection = document.getElementById("notifications-section") as HTMLDivElement;
const settingsSection = document.getElementById("settings-section") as HTMLDivElement;
const switchPageIcon = document.getElementById("settings") as HTMLButtonElement;
const loadingContainer = document.getElementById("loading-container") as HTMLDivElement;
const notificationsContainer = document.getElementById("notifications-container") as HTMLDivElement;
const themeButton = document.getElementById("theme-button") as HTMLButtonElement;
const markAllReadButton = document.getElementById("mark-all-read") as HTMLButtonElement;
const markReadLoading = document.getElementById("mark-read-loading") as HTMLDivElement;

switchPageIcon.onclick = () => {
  notificationsSection.classList.toggle("hidden");
  settingsSection.classList.toggle("hidden");
  if(settingsSection.classList.contains("hidden")) {
    switchPageIcon.innerHTML = "<svg xmlns=\"http://www.w3.org/2000/svg\" height=\"18\" viewBox=\"0 96 960 960\" width=\"18\"><path fill=\"#ffffff\" d=\"m388 976-20-126q-19-7-40-19t-37-25l-118 54-93-164 108-79q-2-9-2.5-20.5T185 576q0-9 .5-20.5T188 535L80 456l93-164 118 54q16-13 37-25t40-18l20-127h184l20 126q19 7 40.5 18.5T669 346l118-54 93 164-108 77q2 10 2.5 21.5t.5 21.5q0 10-.5 21t-2.5 21l108 78-93 164-118-54q-16 13-36.5 25.5T592 850l-20 126H388Zm92-270q54 0 92-38t38-92q0-54-38-92t-92-38q-54 0-92 38t-38 92q0 54 38 92t92 38Zm0-60q-29 0-49.5-20.5T410 576q0-29 20.5-49.5T480 506q29 0 49.5 20.5T550 576q0 29-20.5 49.5T480 646Zm0-70Zm-44 340h88l14-112q33-8 62.5-25t53.5-41l106 46 40-72-94-69q4-17 6.5-33.5T715 576q0-17-2-33.5t-7-33.5l94-69-40-72-106 46q-23-26-52-43.5T538 348l-14-112h-88l-14 112q-34 7-63.5 24T306 414l-106-46-40 72 94 69q-4 17-6.5 33.5T245 576q0 17 2.5 33.5T254 643l-94 69 40 72 106-46q24 24 53.5 41t62.5 25l14 112Z\"/></svg>";
  } else {
    switchPageIcon.innerHTML = "<svg xmlns=\"http://www.w3.org/2000/svg\" height=\"18\" viewBox=\"0 96 960 960\" width=\"18\"><path fill=\"#fff\" d=\"M480 896 160 576l320-320 42 42-248 248h526v60H274l248 248-42 42Z\"/></svg>";
  }
};

if(CACHED_DATA) {
  void renderFromCache(notificationsContainer, CACHED_DATA);
  if(CACHED_DATA.cursor === null) {
    loadingContainer.style.display = "none";
  }
} else {
  void loadNotifications();
}

function checkScroll (): void {
  if(notLoading && Math.abs(notificationsSection.scrollHeight - notificationsSection.scrollTop - notificationsSection.clientHeight) <= 76) {
    notLoading = false;
    void loadNotifications();
  }
}

// Theme changer
updateFromTheme();
themeButton.onclick = () => {
  notificationsTheme = notificationsTheme === "light" ? "dark" : "light";
  updateFromTheme();
  void chrome.storage.local.set({ "notificationsTheme": notificationsTheme });
};

// Load notifications on scroll
notificationsSection.addEventListener("scroll", checkScroll, { passive: true });

// Mark all items as read
markAllReadButton.onclick = () => {
  markReadLoading.style.display = "inline-block";
  markAllReadButton.disabled = true;
  markAllRead().then(() => {
    markReadLoading.style.display = "none";
    markAllReadButton.disabled = false;
    void chrome.action.setBadgeText({
      text: ""
    });
  })
    .catch((error) => {
      console.error("Error in 'Mark As Read': ", error);
    });
};

// Whether or not we are currently loading data, used by the scroll listener
let notLoading = true;

// A document fragment for speed
const fragment = new DocumentFragment();

// Retrieve the next page of notifications
function loadNotifications (): void {
  console.time("load-notifications");
  void notificationsGenerator
    .next()
    .then(async ({ value: notifications, done }) => {
      console.timeEnd("load-notifications");
      // If user is not logged in
      if(notifications === undefined && done === true) {
        loadingContainer.remove();
        notificationsSection.removeEventListener("scroll", checkScroll);
        const notice = loggedOutNotice();
        notificationsContainer.appendChild(notice);
        return;
      } else if(notifications.length === 0 && done === false && notificationsContainer.innerHTML === "") {
        loadingContainer.remove();
        notificationsSection.removeEventListener("scroll", checkScroll);
        notificationsContainer.innerHTML += "<div class=\"notification\"><div class=\"notification-header\"><img class=\"notification-author--avatar\" src=\"32.png\"><h3 class=\"notification-author--nickname\">KA Notifications</h3><span class=\"notification-date\">0s ago</span></div><p class=\"notification-content\">You have no notifications.</p></div>";
        return;
      }

      console.log("Notifications (popup): ", notifications);

      for await (const notification of notifications) {
        fragment.appendChild(await createNotificationHTMLDivElement(notification));
      }

      notificationsContainer.appendChild(fragment);

      // Allow notification loading now that task is complete
      notLoading = true;
    });
}

// Clears all unread notifications
function markAllRead (): Promise<ClearBrandNewNotificationsResponse> {
  return new Promise((resolve, reject) => {
    getChromeFkey()
      .then((fkey) => graphQLFetch("clearBrandNewNotifications", fkey))
      .then(async (response) => {
        const json = await response.json() as ClearBrandNewNotificationsResponse;
        if(json.data.clearBrandNewNotifications.error?.code === "UNAUTHORIZED") {
          reject();
        } else {
          resolve(json);
        }
      })
      .catch(reject);
  });
}

// Updates the UI based on current theme
function updateFromTheme (): void {
  if(notificationsTheme === "light") {
    themeButton.innerHTML = "<svg stroke=\"#ffffff\" fill=\"none\" stroke-width=\"2\" viewBox=\"0 0 24 24\" stroke-linecap=\"round\" stroke-linejoin=\"round\" height=\"18px\" width=\"18px\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z\"></path></svg>";
    document.body.className = "light";
  } else {
    themeButton.innerHTML = "<svg stroke=\"#ffffff\" fill=\"none\" stroke-width=\"2\" viewBox=\"0 0 24 24\" stroke-linecap=\"round\" stroke-linejoin=\"round\" height=\"18px\" width=\"18px\" xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"12\" cy=\"12\" r=\"5\"></circle><line x1=\"12\" y1=\"1\" x2=\"12\" y2=\"3\"></line><line x1=\"12\" y1=\"21\" x2=\"12\" y2=\"23\"></line><line x1=\"4.22\" y1=\"4.22\" x2=\"5.64\" y2=\"5.64\"></line><line x1=\"18.36\" y1=\"18.36\" x2=\"19.78\" y2=\"19.78\"></line><line x1=\"1\" y1=\"12\" x2=\"3\" y2=\"12\"></line><line x1=\"21\" y1=\"12\" x2=\"23\" y2=\"12\"></line><line x1=\"4.22\" y1=\"19.78\" x2=\"5.64\" y2=\"18.36\"></line><line x1=\"18.36\" y1=\"5.64\" x2=\"19.78\" y2=\"4.22\"></line></svg>";
    document.body.className = "dark";
  }
}

function loggedOutNotice (): HTMLLIElement {
  const notice = document.createElement("li");
  notice.className = "notification unread";
  notice.innerHTML = "<div class=\"notification-header\"><img class=\"notification-author--avatar\" src=\"32.png\"><h3 class=\"notification-author--nickname\">KA Notifications</h3><span class=\"notification-date\">0s ago</span></div><p class=\"notification-content\">You must be <a class=\"hyperlink\" href=\"https://www.khanacademy.org/login/\" target=\"_blank\">logged in</a> to use this extension.</p>";
  return notice;
}
