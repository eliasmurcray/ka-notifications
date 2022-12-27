import QUERIES from "../graphql-queries.json";
import { AssignmentCreatedNotification, AssignmentDueDateNotification, AvatarNotification, BadgeNotification, BasicNotification, CoachRequestAcceptedNotification, CoachRequestNotification, CourseMasteryGoalCreatedNotification, GroupedBadgeNotification, InfoNotification, ModeratorNotification, Notification, NotificationsResponse, ProgramFeedbackNotification, ResponseFeedbackNotification } from "../notification";
import "../css/popup.css";

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

// Retrieve items from local storage
const STORAGE: { [key:string]: any } = await chrome.storage.local.get(["notificationsTheme", "notificationsCache"]);
const THEME: string = STORAGE?.notificationsTheme;
const CACHED_DATA = STORAGE?.notificationsCache;

let notificationsTheme = THEME ?? "light";
let notificationsGenerator: AsyncGenerator<Notification[], Notification[]> = createNotificationsGenerator(CACHED_DATA?.cursor ?? "");

// Retrieve DOM elements
const loadingContainer = document.getElementById("loading-container") as HTMLDivElement;
const notificationsContainer = document.getElementById("notifications-container") as HTMLDivElement;
const notificationsSection = document.getElementById("notifications-section") as HTMLDivElement;
const themeButton = document.getElementById("theme-button") as HTMLButtonElement;
const markAllRead = document.getElementById("mark-all-read") as HTMLButtonElement;
const markReadLoading = document.getElementById("mark-read-loading") as HTMLDivElement;

if(CACHED_DATA) {
  notificationsContainer.innerHTML += CACHED_DATA.preloadString;
} else {
  loadNotifications();
}

function checkScroll(): void {
  if(notLoading && Math.abs(notificationsSection.scrollHeight - notificationsSection.scrollTop - notificationsSection.clientHeight) <= 76) {
    notLoading = false;
    loadNotifications();
  }
}
  
// Theme changer
updateFromTheme();
themeButton.onclick = () => {
  notificationsTheme = notificationsTheme === "light" ? "dark" : "light";
  updateFromTheme();
  chrome.storage.local.set({ "notificationsTheme": notificationsTheme });
};

// Load notifications on scroll
notificationsSection.addEventListener("scroll", checkScroll, { passive: true });

// Mark all items as read
markAllRead.onclick = () => {
  markReadLoading.style.display = "inline-block";
  markAllRead.disabled = true;
  clearNotificationenergyPointRequirement().then(() => {
    markReadLoading.style.display = "none";
    markAllRead.disabled = false;
    chrome.action.setBadgeText({
      text: ""
    });
  })
  .catch((error) => {
    markReadLoading.style.display = "none";
    notificationsContainer.insertAdjacentHTML("afterbegin", `<li class="notification unread"><div class="notification-header"><img class="notification-author--avatar" src="32.png"><h3 class="notification-author--nickname">KA Notifications</h3><span class="notification-date">${timeSince(new Date())} ago</span></div><p class="notification-content">Failed to clear notifications: user must be logged in.</p></li>`);
    console.log(error);
  });
};

// Whether or not we are currently loading data, used by the scroll listener
let notLoading: boolean = true;

// Retrieve the next page of notifications
async function loadNotifications(): Promise<void> {
  console.time("load-notifications");
  notificationsGenerator.next().then(async ({ value: notifications, done }) => {
    console.timeEnd("load-notifications");
    // If user is not logged in
    if(notifications === undefined)
      if(done) {
        loadingContainer.remove();
        notificationsSection.removeEventListener("scroll", checkScroll);
        return;
      } else {
        loadingContainer.remove();
        notificationsContainer.innerHTML += `<li class="notification unread"><div class="notification-header"><img class="notification-author--avatar" src="32.png"><h3 class="notification-author--nickname">KA Notifications</h3><span class="notification-date">${timeSince(new Date())} ago</span></div><p class="notification-content">You must be <a class="hyperlink" href="https://www.khanacademy.org/login/" target="_blank">logged in</a> to use this extension.</p></li>`;
        return;
      }

    // Log notifications for development purposes
    console.log(notifications);
    // Add notifications to DOM
    notificationsContainer.innerHTML += notifications.map(createNotificationString).join("");

    // Allow notification loading now that task is complete
    notLoading = true;
  });
}

// Returns generator function that gets user notifications
async function* createNotificationsGenerator(cursor: string = ""):  AsyncGenerator<Notification[], Notification[]>{
  let complete = false;
  for(;!complete;) {
    // Retrieve user notifications as JSON
    const json: NotificationsResponse = await new Promise((resolve) => {
      getChromeFkey()
      .then((fkey) => graphQLFetch("getNotificationsForUser", fkey, { after: cursor }))
      .then((result) => {
        resolve(result?.data?.user?.notifications)
      })
      .catch((error) => {
        loadingContainer.remove();
        notificationsContainer.innerHTML += `<li class="notification unread"><div class="notification-header"><img class="notification-author--avatar" src="32.png"><h3 class="notification-author--nickname">KA Notifications</h3><span class="notification-date">${timeSince(new Date())} ago</span></div><p class="notification-content">You must be <a class="hyperlink" href="https://www.khanacademy.org/login/" target="_blank">logged in</a> to use this extension.</p></li>`;
        return undefined;
      });
    });

    if(json) {
      // Retrieve a cursor from the JSON
      const nextCursor = json.pageInfo.nextCursor;

      // Update loop control variables
      complete = !nextCursor;
      cursor = nextCursor;

      // Return this set of notifications as JSON
      yield json.notifications;
    } else break;
  }
  return;
}

// Send a message given a valid program ID and qakey
type RequestType = "QUESTION" | "COMMENT";
type ResponseType = "REPLY" | "ANSWER";
async function addFeedback(feedbackType: RequestType, responseType: ResponseType, topicId: string, qaExpandKey: string, textContent: string): Promise<any> {
  return await getChromeFkey()
    .then((fkey) => 
      graphQLFetch("feedbackQuery", fkey, {
        topicId,
        feedbackType,
        currentSort: 1,
        qaExpandKey,
        focusKind: "scratchpad"
      })
      .then((response) => {
        const key: string = response.data.feedback.feedback[0].key;
        return graphQLFetch("AddFeedbackToDiscussion", fkey, { parentKey: key, textContent, feedbackType: responseType });
      }))
      .catch(() => {
        loadingContainer.remove();
        notificationsContainer.innerHTML += `<li class="notification unread"><div class="notification-header"><img class="notification-author--avatar" src="32.png"><h3 class="notification-author--nickname">KA Notifications</h3><span class="notification-date">${timeSince(new Date())} ago</span></div><p class="notification-content">You must be <a class="hyperlink" href="https://www.khanacademy.org/login/" target="_blank">logged in</a> to use this extension.</p></li>`;
      });
}

// Clears all unread notifications
function clearNotificationenergyPointRequirement(): Promise<{ [key: string]: string }> {
  return new Promise((resolve, reject) => {
    getChromeFkey()
      .then((fkey) => graphQLFetch("clearBrandNewNotifications", fkey))
      .then((json) => {
        if(json.data.clearBrandNewNotifications.error?.code === "UNAUTHORIZED") {
          reject();
        } else {
          resolve(json);
        }
      })
      .catch(reject)
  });
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

function escapeHTML(text: string): string {
  return text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

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
      return `<li class="notification ${brandNew ? " unread" : ""}"><div class="notification-header"><img class="notification-author--avatar" src="${authorAvatarUrl}"><h3 class="notification-author--nickname">${escapeHTML(authorNickname)}</h3><a class="hyperlink" href="https://www.khanacademy.org${url}" target="_blank">${feedbackType === "REPLY" ? "added a comment" : "answered your question"} on ${focusTranslatedTitle}</a><span class="notification-date">${timeSince(new Date(date))} ago</span></div><p class="notification-content">${escapeHTML(content)}</p></li>`;
    }
    case "ProgramFeedbackNotification": {
      const { authorAvatarSrc, authorNickname, content, feedbackType, translatedScratchpadTitle } = notification as ProgramFeedbackNotification & BasicNotification;
      return `<li class="notification ${brandNew ? " unread" : ""}"><div class="notification-header"><img class="notification-author--avatar" src="${authorAvatarSrc}"><h3 class="notification-author--nickname">${escapeHTML(authorNickname)}</h3><a class="hyperlink" href="https://www.khanacademy.org${url}" target="_blank">${feedbackType === "COMMENT" ? "commented" : "asked a question"} on ${translatedScratchpadTitle}</a><span class="notification-date">${timeSince(new Date(date))} ago</span></div><p class="notification-content">${escapeHTML(content)}</p></li>`;
    }
    case "GroupedBadgeNotification": {
      let badgeString = "";
      const { badgeNotifications } = notification as GroupedBadgeNotification & BasicNotification;
      if(badgeNotifications.length === 2)
        badgeString = badgeNotifications[0].badge.description + " and " + badgeNotifications[1].badge.description;
      else
        badgeString = badgeNotifications.map((badge) => badge.badge.description).slice(0, -1).join(", ") + ", and " + badgeNotifications[badgeNotifications.length - 1].badge.description;
      return `<li class="notification ${brandNew ? " unread" : ""}"><div class="notification-header"><img class="notification-author--avatar" src="${badgeNotifications[0].badge.icons.compactUrl}"><h3 class="notification-author--nickname">KA Badges</h3><a class="hyperlink" href="https://www.khanacademy.org${url}" target="_blank">view badges</a><span class="notification-date">${timeSince(new Date(date))} ago</span></div><p class="notification-content">You earned ${badgeString}! Congratulations!</p></li>`;
    }
    case "BadgeNotification": {
      const { badge: { description, icons: { compactUrl }, relativeUrl } } = notification as BadgeNotification & BasicNotification;
      return `<li class="notification ${brandNew ? " unread" : ""}"><div class="notification-header"><img class="notification-author--avatar" src="${compactUrl}"><h3 class="notification-author--nickname">KA Badges</h3><a class="hyperlink" href="https://www.khanacademy.org${relativeUrl}" target="_blank">view badges</a><span class="notification-date">${timeSince(new Date(date))} ago</span></div><p class="notification-content">You earned ${description}! Congratulations!</p></li>`;
    }
    case "ModeratorNotification": {
      const { text } = notification as ModeratorNotification & BasicNotification;
      return `<li class="notification ${brandNew ? " unread" : ""}"><div class="notification-header"><img class="notification-author--avatar" src="guardian-icon.png"><h3 class="notification-author--nickname">KA Badges</h3><span class="notification-date">${timeSince(new Date(date))} ago</span></div><p class="notification-content">${text}</p></li>`;
    }
    case "AvatarNotification": {
      const { name, thumbnailSrc } = notification as AvatarNotification & BasicNotification;
      return `<li class="notification ${brandNew ? " unread" : ""}"><div class="notification-header"><img class="notification-author--avatar" src="${thumbnailSrc.startsWith("https://cdn.kastatic.org/") ? thumbnailSrc : "https://cdn.kastatic.org" + thumbnailSrc}"><h3 class="notification-author--nickname">KA Avatars</h3><span class="notification-date">${timeSince(new Date(date))} ago</span></div><p class="notification-content">You unlocked <b>${AVATAR_SHORTNAMES[name]}</b>! <i>${AVATAR_REQUIREMENTS[name]}</i></p></li>`;
    }
    default:
      return `<li class="notification"><pre style="width:100%;overflow-x:auto">${JSON.stringify(notification, null, 2)}</pre></li>`;
    }
}

// Updates the UI based on current theme
function updateFromTheme(): void {
  if(notificationsTheme === "light") {
    themeButton.innerHTML = '<svg stroke="#ffffff" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="18px" width="18px" xmlns="http://www.w3.org/2000/svg"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
    document.body.className = "light";
  } else {
    themeButton.innerHTML = '<svg stroke="#ffffff" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="18px" width="18px" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
    document.body.className = "dark";
  }
}