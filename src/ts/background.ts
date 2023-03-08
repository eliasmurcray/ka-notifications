import { AssignmentCreatedNotification, AssignmentDueDateNotification, AvatarNotification, BadgeNotification, BasicNotification, CoachRequestAcceptedNotification, CoachRequestNotification, CourseMasteryGoalCreatedNotification, GroupedBadgeNotification, InfoNotification, ModeratorNotification, Notification, NotificationsResponse, ProgramFeedbackNotification, ResponseFeedbackNotification } from "../notification";
import QUERIES from "../graphql-queries.json";
import { escapeHTML, parseAndRender } from "./markdown";

// Set background color of badge to teal
chrome.action.setBadgeBackgroundColor({
  color: "#00BFA5"
});

// Add event listener to user logout sessions
chrome.cookies.onChanged.addListener(({ cookie, removed }) => {
  if(cookie.name === "KAAS")
    if(removed === true) {
      chrome.action.setBadgeText({ text: "!" });
    } else {
      chrome.action.setBadgeText({ text: "" });
      checkForNewNotifications();
    }
});

const ALARM_NAME: string = "khanAcademyNotifications";

// When alarm "khanAcademyNotifications" goes off, check for new notifications
chrome.alarms.onAlarm.addListener(({ name }) => {
  if(name === ALARM_NAME) checkForNewNotifications();
  console.log("Alarm " + name + " fired.");
});
  
// Run an initial check
checkForNewNotifications();

// Set delay between checks to 1 minute
chrome.alarms.create(ALARM_NAME, {
  periodInMinutes: 1
});

function checkForNewNotifications(): void {
  getChromeFkey()
    .then((fkey) => {
      graphQLFetch("getFullUserProfile", fkey)
      .then(async ({ data: { user } }) => {
        // If user is not logged in show an error
        if(user === null)
          return chrome.action.setBadgeText({ text: "!" });
        
        // Or else, update notification count
        const { newNotificationCount } = user;

        if(newNotificationCount > 0) {
          // Preload data
          graphQLFetch("getNotificationsForUser", fkey)
          .then(({ data: { user: { notifications } } }) => {
            const cursor = notifications.pageInfo.nextCursor;
            const preloadString = notifications.notifications.map(createNotificationString).join("");
            chrome.storage.local.set({ notificationsCache: { cursor, preloadString } });
            chrome.action.setBadgeText({ text: newNotificationCount > 99 ? "99+" : String(newNotificationCount) });
          })
          .catch((error) => {
            console.error("Error code 2: " + error);
            chrome.action.setBadgeText({ text: "!" });
          });
        } else {
          chrome.action.setBadgeText({ text: "" });
        }
      })
      .catch((error) => {
        chrome.action.setBadgeText({ text: "!" });
        console.error("Error code 3: " + error);
      });
  })
}

function graphQLFetch(query: string, fkey: string, variables: { [key:string]: any } = {}): Promise<{ [key: string]: any }> {
  return new Promise((resolve, reject) => {
    fetch("https://www.khanacademy.org/api/internal/graphql/" + query + "?/math/", {
      method: "POST",
      headers: {
        "X-KA-fkey": fkey,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        operationName: query,
        query: QUERIES[query],
        variables
      }),
      credentials: "same-origin"
    })
    .then(async (response: Response) => {
      if (response.status === 200) return resolve(await response.json());
      reject(`Error in GraphQL ${query} call: Server responded  with status ${response.status} and body ${JSON.stringify(await response.text())}`);
    })
    .catch((error) => {
      console.error("Error code 4: " + error);
    });
  });
}

function getChromeFkey(): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.cookies.get({
      url: "https://www.khanacademy.org",
      name: "fkey"
    }, (cookie) => {
      if (cookie === null) reject("fkey cookie not found.");
      resolve(cookie.value);
    });
  });
}


// Fomat a number based on current location format
function energyPointRequirement(points: number) {
  return `Earn ${Intl.NumberFormat(navigator.language).format(points)} energy points.`;
}

// Lookup table for avatar short names
const AVATAR_SHORTNAMES = {
  "hopper_happy_style": "Hopper",
  "hopper_cool_style": "Cool Hopper",
  "hopper_jumping_style": "Jumping Hopper",
  "leafers_seed_style": "Leafers",
  "leafers_seedling_style": "Leafers",
  "leafers_sapling_style": "Leafers",
  "leafers_tree_style": "Leafers",
  "leafers_ultimate_style": "Leafers",
  "piceratops_seed_style": "&Pi;ceratops",
  "piceratops_seedling_style": "&Pi;ceratops",
  "piceratops_sapling_style": "&Pi;ceratops",
  "piceratops_tree_style": "&Pi;ceratops",
  "piceratops_ultimate_style": "&Pi;ceratops",
  "duskpin_seed_style": "Duskpin",
  "duskpin_seedling_style": "Duskpin",
  "duskpin_sapling_style": "Duskpin",
  "duskpin_tree_style": "Duskpin",
  "duskpin_ultimate_style": "Duskpin",
  "primosaur_seed_style": "Primosaur",
  "primosaur_seedling_style": "Primosaur",
  "primosaur_sapling_style": "Primosaur",
  "primosaur_tree_style": "Primosaur",
  "primosaur_ultimate_style": "Primosaur",
  "starky_seed_style": "Starky",
  "starky_seedling_style": "Starky",
  "starky_sapling_style": "Starky",
  "starky_tree_style": "Starky",
  "starky_ultimate_style": "Starky",
  "aqualine_seed_style": "Aqualine",
  "aqualine_seedling_style": "Aqualine",
  "aqualine_sapling_style": "Aqualine",
  "aqualine_tree_style": "Aqualine",
  "aqualine_ultimate_style": "Aqualine",
  "spunky_sam_blue_style": "Spunky Sam",
  "spunky_sam_green_style": "Spunky Sam",
  "spunky_sam_orange_style": "Spunky Sam",
  "spunky_sam_red_style": "Spunky Sam",
  "marcimus_pink_style": "Marcimus",
  "marcimus_orange_style": "Marcimus",
  "marcimus_red_style": "Marcimus",
  "marcimus_purple_style": "Marcimus",
  "mr_pink_red_style": "Mr. Pink",
  "mr_pink_green_style": "Mr. Pink",
  "mr_pink_orange_style": "Mr. Pink",
  "female_robot_amelia_style": "Amelia",
  "female_robot_ada_style": "Ada",
  "female_robot_grace_style": "Grace",
  "male_robot_johnny_style": "Johnny",
  "male_robot_donald_style": "Donald",
  "male_robot_hal_style": "Hal",
  "orange_juice_squid_orange_style": "Orange Juice Squid",
  "purple_pi_purple_style": "Purple Pi",
  "purple_pi_pink_style": "Purple Pi",
  "purple_pi_teal_style": "Purple Pi",
  "mr_pants_teal_style": "Mr. Pants",
  "mr_pants_green_style": "Mr. Pants",
  "mr_pants_orange_style": "Mr. Pants",
  "mr_pants_pink_style": "Mr. Pants",
  "mr_pants_purple_style": "Mr. Pants",
  "old_spice_man_green_style": "Old Spice Man",
  "old_spice_man_blue_style": "Old Spice Man",
  "winston_default_style": "Winston",
  "winston_baby_style": "Baby Winston",
  "ohnoes_default_style": "Oh noes, the Error Buddy"
};

// Lookup table for avatar requirements
const AVATAR_REQUIREMENTS = {
  "leafers_seedling_style": energyPointRequirement(1e4),
  "piceratops_seedling_style": energyPointRequirement(1e4),
  "duskpin_seedling_style": energyPointRequirement(1e4),
  "primosaur_seedling_style": energyPointRequirement(1e4),
  "starky_seedling_style": energyPointRequirement(1e4),
  "spunky_sam_blue_style": energyPointRequirement(1e4),
  "spunky_sam_green_style": energyPointRequirement(1e4),
  "spunky_sam_orange_style": energyPointRequirement(1e4),
  "spunky_sam_red_style": energyPointRequirement(1e4),
  "marcimus_pink_style": energyPointRequirement(1e4),
  "marcimus_orange_style": energyPointRequirement(1e4),
  "marcimus_red_style": energyPointRequirement(1e4),
  "marcimus_purple_style": energyPointRequirement(1e4),
  "mr_pink_red_style": energyPointRequirement(1e4),
  "mr_pink_green_style": energyPointRequirement(1e4),
  "mr_pink_orange_style": energyPointRequirement(1e4),
  "mr_pants_teal_style": energyPointRequirement(1e4),
  "mr_pants_green_style": energyPointRequirement(1e4),
  "mr_pants_orange_style": energyPointRequirement(1e4),
  "mr_pants_pink_style": energyPointRequirement(1e4),
  "mr_pants_purple_style": energyPointRequirement(1e4),
  "old_spice_man_green_style": energyPointRequirement(1e4),
  "old_spice_man_blue_style": energyPointRequirement(1e4),
  "leafers_sapling_style": energyPointRequirement(5e4),
  "piceratops_sapling_style": energyPointRequirement(5e4),
  "duskpin_sapling_style": energyPointRequirement(5e4),
  "primosaur_sapling_style": energyPointRequirement(5e4),
  "starky_sapling_style": energyPointRequirement(5e4),
  "female_robot_amelia_style": energyPointRequirement(5e4),
  "male_robot_johnny_style": energyPointRequirement(5e4),
  "orange_juice_squid_orange_style": energyPointRequirement(5e4),
  "purple_pi_purple_style": energyPointRequirement(5e4),
  "purple_pi_pink_style": energyPointRequirement(5e4),
  "purple_pi_teal_style": energyPointRequirement(5e4),
  "leafers_tree_style": energyPointRequirement(1e5),
  "piceratops_tree_style": energyPointRequirement(1e5),
  "duskpin_tree_style": energyPointRequirement(1e5),
  "primosaur_tree_style": energyPointRequirement(1e5),
  "starky_tree_style": energyPointRequirement(1e5),
  "female_robot_ada_style": energyPointRequirement(1e5),
  "male_robot_donald_style": energyPointRequirement(1e5),
  "leafers_ultimate_style": energyPointRequirement(25e4),
  "piceratops_ultimate_style": energyPointRequirement(25e4),
  "duskpin_ultimate_style": energyPointRequirement(25e4),
  "primosaur_ultimate_style": energyPointRequirement(25e4),
  "starky_ultimate_style": energyPointRequirement(25e4),
  "female_robot_grace_style": energyPointRequirement(25e4),
  "male_robot_hal_style": energyPointRequirement(25e4),
  "winston_default_style": "Make changes to an official program",
  "winston_baby_style": "Make changes to another user's program",
  "ohnoes_default_style": "Finish watching a computer programming talk-through",
  "hopper_happy_style": "Create a program from scratch",
  "hopper_jumping_style": "Complete a coding challenge",
  "hopper_cool_style": "Complete a coding challenge"
};

function timeSince(date: Date): string {
  const seconds = ~~((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) {
    return `${seconds} second${seconds === 1 ? '' : 's'}`;
  }

  if (seconds < 3600) {
    const minutes = ~~(seconds / 60);
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  }

  if (seconds < 86400) {
    const hours = ~~(seconds / 3600);
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  }

  if (seconds < 2592000) {
    const days = ~~(seconds / 86400);
    return `${days} day${days === 1 ? '' : 's'}`;
  }

  if (seconds < 31536000) {
    const months = ~~(seconds / 2592000);
    return `${months} month${months === 1 ? '' : 's'}`;
  }

  const years = ~~(seconds / 31536000);
  return `${years} year${years === 1 ? '' : 's'}`;
}

// Creates an HTML parsable string from a Notification object
function createNotificationString(notification: Notification): string {
  const { __typename, brandNew, date, url } = notification;
  switch(__typename) {
    case "ResponseFeedbackNotification": {
      const { authorAvatarUrl, authorNickname, content, feedbackType, focusTranslatedTitle } = notification as ResponseFeedbackNotification & BasicNotification;
      return `<li class="notification ${brandNew ? "unread" : ""}"><div class="notification-header"><img class="notification-author--avatar" src="${authorAvatarUrl}"><h3 class="notification-author--nickname">${escapeHTML(authorNickname)}</h3><a class="hyperlink" href="https://www.khanacademy.org${url}" target="_blank">${feedbackType === "REPLY" ? "added a comment" : "answered your question"} on ${focusTranslatedTitle}</a><span class="notification-date">${timeSince(new Date(date))} ago</span></div><p class="notification-content">${parseAndRender(content)}</p><div class="feedback-button-wrapper"><button class="feedback-button" data-url="${url}" data-typename="ResponseFeedbackNotification" data-feedbackType="${feedbackType}">Reply</button></div></li>`;
    }
    case "ProgramFeedbackNotification": {
      const { authorAvatarSrc, authorNickname, content, feedbackType, translatedScratchpadTitle } = notification as ProgramFeedbackNotification & BasicNotification;
      return `<li class="notification ${brandNew ? "unread" : ""}"><div class="notification-header"><img class="notification-author--avatar" src="${authorAvatarSrc}"><h3 class="notification-author--nickname">${escapeHTML(authorNickname)}</h3><a class="hyperlink" href="https://www.khanacademy.org${url}" target="_blank">${feedbackType === "COMMENT" ? "commented" : "asked a question"} on ${translatedScratchpadTitle}</a><span class="notification-date">${timeSince(new Date(date))} ago</span></div><p class="notification-content">${parseAndRender(content)}</p><div class="feedback-button-wrapper"><button class="feedback-button" data-url="${url}" data-typename="ProgramFeedbackNotification" data-feedbackType="${feedbackType}">Reply</button></div></li>`;
    }
    case "GroupedBadgeNotification": {
      let badgeString = "";
      const { badgeNotifications } = notification as GroupedBadgeNotification & BasicNotification;
      if(badgeNotifications.length === 2)
        badgeString = badgeNotifications[0].badge.description + " and " + badgeNotifications[1].badge.description;
      else
        badgeString = badgeNotifications.map((badge) => badge.badge.description).slice(0, -1).join(", ") + ", and " + badgeNotifications[badgeNotifications.length - 1].badge.description;
      return `<li class="notification ${brandNew ? "unread" : ""}"><div class="notification-header"><img class="notification-author--avatar" src="${badgeNotifications[0].badge.icons.compactUrl}"><h3 class="notification-author--nickname">KA Badges</h3><a class="hyperlink" href="https://www.khanacademy.org${url}" target="_blank">view badges</a><span class="notification-date">${timeSince(new Date(date))} ago</span></div><p class="notification-content">You earned ${badgeString}! Congratulations!</p></li>`;
    }
    case "BadgeNotification": {
      const { badge: { description, icons: { compactUrl }, relativeUrl } } = notification as BadgeNotification & BasicNotification;
      `<li class="notification ${brandNew ? "unread" : ""}"><div class="notification-header"><img class="notification-author--avatar" src="${compactUrl}"><h3 class="notification-author--nickname">KA Badges</h3><a class="hyperlink" href="https://www.khanacademy.org${relativeUrl}" target="_blank">view badges</a><span class="notification-date">${timeSince(new Date(date))} ago</span></div><p class="notification-content">You earned ${description}! Congratulations!</p></li>`;
    }
    case "ModeratorNotification": {
      const { text } = notification as ModeratorNotification & BasicNotification;
      return `<li class="notification ${brandNew ? "unread" : ""}"><div class="notification-header"><img class="notification-author--avatar" src="guardian-icon.png"><h3 class="notification-author--nickname">KA Badges</h3><span class="notification-date">${timeSince(new Date(date))} ago</span></div><p class="notification-content">${text}</p></li>`;
    }
    case "AvatarNotification": {
      const { name, thumbnailSrc, url } = notification as AvatarNotification & BasicNotification;
      return `<li class="notification ${brandNew ? "unread" : ""}"><div class="notification-header"><img class="notification-author--avatar" src="${thumbnailSrc.startsWith("https://cdn.kastatic.org/") ? thumbnailSrc : "https://cdn.kastatic.org" + thumbnailSrc}"><h3 class="notification-author--nickname">KA Avatars</h3><a class="hyperlink" href="https://www.khanacademy.org${url}" target="_blank">use avatar</a><span class="notification-date">${timeSince(new Date(date))} ago</span></div><p class="notification-content">You unlocked <b>${AVATAR_SHORTNAMES[name]}</b>! <i>${AVATAR_REQUIREMENTS[name]}</i></p></li>`;
    }
    default:
      return `<li class="notification"><pre style="width:100%;overflow-x:auto">${JSON.stringify(notification, null, 2)}</pre></li>`;
    }
}