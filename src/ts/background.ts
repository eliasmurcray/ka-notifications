import { createNotificationString, filterNotifications } from "../util/notifications";
import { graphQLFetch, getChromeFkey } from "../util/graphql";
import { GetFullUserProfileResponse, GetNotificationsForUserResponse } from "../@types/responses";

// Set background color of badge to teal
void chrome.action.setBadgeBackgroundColor({
  color: "#00BFA5"
});

// Add event listener to user logout sessions
void chrome.cookies.onChanged.addListener(({ cookie, removed }) => {
  if(cookie.name === "KAAS") {
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

          if(newNotificationCount > 0) {
            // Preload data
            graphQLFetch("getNotificationsForUser", fkey)
              .then(async (response) => {
                const json = await response.json() as GetNotificationsForUserResponse;
                const notificationsResponse = json?.data?.user?.notifications;
                if(!notificationsResponse) {
                  return void chrome.action.setBadgeText({ text: "" });
                }
                console.log("Notifications (background): ", notificationsResponse);

                notificationsResponse.notifications = await filterNotifications(fkey, notificationsResponse.notifications);

                const cursor = notificationsResponse.pageInfo.nextCursor;
                const preloadString = notificationsResponse.notifications.map(createNotificationString).join("");
                void chrome.storage.local.set({ notificationsCache: { cursor, preloadString } });
                void chrome.action.setBadgeText({ text: notificationsResponse.notifications.length > 99 ? "99+" : String(newNotificationCount) });
              })
              .catch((error) => {
                console.error("ERROR [2]: ", error);
                void chrome.action.setBadgeText({ text: "!" });
              });
          } else {
            void chrome.action.setBadgeText({ text: "" });
          }
        })
        .catch((error) => {
          console.error("ERROR [3]: ", error);
        });
    })
    .catch((error) => {
      console.error("ERROR [fkey]: ", error);
    });
}
