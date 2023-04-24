import { createNotificationString } from "../util/notifications";
import { graphQLFetch, getChromeFkey } from "../util/graphql";
import { GetFullUserProfileResponse, GetNotificationsForUserResponse } from "../@types/responses";

// Huge thanks
// Create the offscreen document if it doesn't already exist
async function createOffscreen () {
  if (await chrome.offscreen.hasDocument?.()) {
    return;
  }
  await chrome.offscreen.createDocument({
    url: chrome.runtime.getURL("heartbeat.html"),
    reasons: [chrome.offscreen.Reason.BLOBS],
    justification: "keep service worker running",
  });
}

chrome.runtime.onStartup.addListener(() => {
  void createOffscreen();
});
chrome.runtime.onInstalled.addListener(() => {
  void createOffscreen();
});

// A message from an offscreen document every 20 second resets the inactivity timer
chrome.runtime.onMessage.addListener((message: { keepAlive?: boolean }) => {
  if (message.keepAlive) {
    (1 + 1);
  }
});

// Set background color of badge to teal
void chrome.action.setBadgeBackgroundColor({
  color: "#00BFA5"
});

// Add event listener to user logout sessions
void chrome.cookies.onChanged.addListener(({ cookie, removed }) => {
  if(cookie.name === "KAAS" || cookie.name === "fkey") {
    void chrome.action.setBadgeText({ text: "" });
    void chrome.storage.local.remove("notificationsCache");
    if(removed === false) {
      checkForNewNotifications();
    }
  }
});

const ALARM_NAME = "khanAcademyNotifications";

// When alarm 'khanAcademyNotifications' goes off, check for new notifications
void chrome.alarms.onAlarm.addListener(({ name }) => {
  if(name === ALARM_NAME) {
    checkForNewNotifications();
  }
});

// Run an initial check
checkForNewNotifications();

// Set delay between checks to 1 minute
void chrome.alarms.create(ALARM_NAME, {
  periodInMinutes: 1
});

function checkForNewNotifications (): void {
  getChromeFkey()
    .then((fkey) => {
      graphQLFetch("getFullUserProfile", fkey)
        .then(async (response) => {
          const json = await response.json() as GetFullUserProfileResponse;
          const { data: { user } } = json;

          // If user is not logged in
          if(user === null) {
            void chrome.storage.local.remove("notificationsCache");
            return void chrome.action.setBadgeText({ text: "" });
          }

          // Or else, update notification count
          const { newNotificationCount } = user;

          // Preload data
          graphQLFetch("getNotificationsForUser", fkey)
            .then(async (response) => {
              const json = await response.json() as GetNotificationsForUserResponse;
              const notificationsResponse = json?.data?.user?.notifications;
              if(!notificationsResponse) {
                return void chrome.action.setBadgeText({ text: "" });
              }
              console.log("Notifications (background): ", notificationsResponse);

              // notificationsResponse.notifications = await filterNotifications(fkey, notificationsResponse.notifications);

              const cursor = notificationsResponse.pageInfo.nextCursor;
              const preloadString = notificationsResponse.notifications.map(createNotificationString).join("");
              void chrome.storage.local.set({ notificationsCache: { cursor, preloadString } });
              if(newNotificationCount > 0) {
                void chrome.action.setBadgeText({ text: notificationsResponse.notifications.length > 99 ? "99+" : String(newNotificationCount) });
              } else {
                void chrome.action.setBadgeText({ text: "" });
              }
            })
            .catch((error) => {
              console.error("ERROR [getNotificationsForUser]: ", error);
              void chrome.action.setBadgeText({ text: "!" });
            });
        })
        .catch((error) => {
          console.error("ERROR [getFullUserProfile]: ", error);
        });
    })
    .catch(() => {
      void chrome.action.setBadgeText({ text: "!" });
    });
}
