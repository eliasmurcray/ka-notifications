import { createNotificationString, getNotifParent } from "../util/notifications";
import { graphQLFetch, getChromeFkey } from "../util/graphql";

// Set background color of badge to teal
chrome.action.setBadgeBackgroundColor({
  color: "#00BFA5"
});

// Add event listener to user logout sessions
chrome.cookies.onChanged.addListener(({ cookie, removed }) => {
  if(cookie.name === "KAAS") {
    chrome.action.setBadgeText({ text: "" });
    chrome.storage.local.remove("notificationsCache");
    if(removed === false) {
      checkForNewNotifications();
    }
  }
});

const ALARM_NAME = "khanAcademyNotifications";

// When alarm 'khanAcademyNotifications' goes off, check for new notifications
chrome.alarms.onAlarm.addListener(({ name }) => {
  if(name === ALARM_NAME) {
    checkForNewNotifications();
  }
  console.log("Alarm " + name + " fired.");
});

// Run an initial check
checkForNewNotifications();

// Set delay between checks to 1 minute
chrome.alarms.create(ALARM_NAME, {
  periodInMinutes: 0.5
});

function checkForNewNotifications (): void {
  getChromeFkey()
    .then((fkey) => {
      graphQLFetch("getFullUserProfile", fkey)
        .then(async (response) => {
          const json = await response.json();
          const { data: { user } } = json;

          // If user is not logged in show an error
          if(user === null) {
            chrome.storage.local.remove("notificationsCache");
            return chrome.action.setBadgeText({ text: "" });
          }

          // Or else, update notification count
          const { newNotificationCount } = user;
        //   if(newNotificationCount > 0) { console.log("[dev] new notifs") };
            // Preload data
            graphQLFetch("getNotificationsForUser", fkey)
              .then(async (response) => {
                const json = await response.json();
                let { data: { user: { notifications } } } = json;
                console.log("Notifications (background): ", notifications);

                // Duplicate the notifications object, then filter for messages
                // whose expand key is not in the ignore list
                // let fN = JSON.parse(JSON.stringify(notifications));
                // notifications.notifications = (await Promise.all(
                //     notifications.notifications.map(async (x, y) => {
                //         try {
                //             return {
                //                 val: (await getNotifParent(fkey, x)) !== "ag5zfmtoYW4tYWNhZGVteXJBCxIIVXNlckRhdGEiHmthaWRfNDM5MTEwMDUzODMwNzU4MDY1MDIyMDIxMgwLEghGZWVkYmFjaxiAgNPE4Z2eCAw",
                //                 index: y,
                //             }
                //         } catch (e) {
                //             console.log("[dev] Something has gone wrong.", x, y, e);
                //         }
                //     })
                // )).filter(x => x.val).map(x => notifications.notifications[x.index]);
                // console.log("[dev] after removing ignored:", notifications);
                
                const cursor = notifications.pageInfo.nextCursor;
                const preloadString = notifications.notifications.map(createNotificationString).join("");
                chrome.storage.local.set({ notificationsCache: { cursor, preloadString } });
                chrome.action.setBadgeText({ text: notifications.notifications.length > 99 ? "99+" : String(notifications.notifications.length) });
              })
              .catch((error) => {
                console.error("ERROR [2]: " + error);
                chrome.action.setBadgeText({ text: "!" });
              });
        //   } else {
        //     chrome.action.setBadgeText({ text: "" });
        //   }
        })
        .catch((error) => {
          console.error("ERROR [3]: " + error);
        });
    });
}