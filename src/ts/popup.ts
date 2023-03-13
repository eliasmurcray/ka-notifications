import { Notification } from '../notification';
import { graphQLFetch, getChromeFkey } from '../util/graphql';
import { createNotificationsGenerator, createNotificationHTMLDivElement, renderFromCache } from '../util/notifications';
import '../css/popup.css';

// Retrieve items from local storage
const STORAGE: { [key:string]: any } = await chrome.storage.local.get(['notificationsTheme', 'notificationsCache']);
chrome.storage.local.remove('notificationsCache');
const THEME: string = STORAGE?.notificationsTheme;
const CACHED_DATA = STORAGE?.notificationsCache;

let notificationsTheme = THEME ?? 'light';
let notificationsGenerator: AsyncGenerator<Notification[], Notification[]> = createNotificationsGenerator(CACHED_DATA?.cursor ?? '');

// Retrieve DOM elements
const loadingContainer = document.getElementById('loading-container') as HTMLDivElement;
const notificationsContainer = document.getElementById('notifications-container') as HTMLDivElement;
const notificationsSection = document.getElementById('notifications-section') as HTMLDivElement;
const themeButton = document.getElementById('theme-button') as HTMLButtonElement;
const markAllReadButton = document.getElementById('mark-all-read') as HTMLButtonElement;
const markReadLoading = document.getElementById('mark-read-loading') as HTMLDivElement;

if(CACHED_DATA) {
  renderFromCache(notificationsContainer, CACHED_DATA);
  if(CACHED_DATA.cursor === null) {
    loadingContainer.style.display = 'none';
  }
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
  notificationsTheme = notificationsTheme === 'light' ? 'dark' : 'light';
  updateFromTheme();
  chrome.storage.local.set({ 'notificationsTheme': notificationsTheme });
};

// Load notifications on scroll
notificationsSection.addEventListener('scroll', checkScroll, { passive: true });

// Mark all items as read
markAllRead.onclick = () => {
  markReadLoading.style.display = 'inline-block';
  markAllReadButton.disabled = true;
  markAllRead().then(() => {
    markReadLoading.style.display = 'none';
    markAllReadButton.disabled = false;
    chrome.action.setBadgeText({
      text: ''
    });
  })
  .catch((error) => {
    /*
    markReadLoading.style.display = 'none';
    notificationsContainer.insertAdjacentHTML('afterbegin', `<li class='notification unread'><div class='notification-header'><img class='notification-author--avatar' src='32.png'><h3 class='notification-author--nickname'>KA Notifications</h3><span class='notification-date'>${timeSince(new Date())} ago</span></div><p class='notification-content'>Failed to clear notifications: user must be logged in.</p></li>`);
    console.log(error);*/
  });
};

// Whether or not we are currently loading data, used by the scroll listener
let notLoading: boolean = true;

// A document fragment for speed
const fragment = new DocumentFragment();

// Retrieve the next page of notifications
async function loadNotifications(): Promise<void> {
  console.time('load-notifications');
  notificationsGenerator.next().then(async ({ value: notifications, done }) => {
    console.timeEnd('load-notifications');
    // If user is not logged in
    if(!notifications)
      if(done) {
        loadingContainer.remove();
        notificationsSection.removeEventListener('scroll', checkScroll);
        return;
      } else {
        /*
        loadingContainer.remove();
        notificationsContainer.innerHTML += `<li class='notification unread'><div class='notification-header'><img class='notification-author--avatar' src='32.png'><h3 class='notification-author--nickname'>KA Notifications</h3><span class='notification-date'>${timeSince(new Date())} ago</span></div><p class='notification-content'>You must be <a class='hyperlink' href='https://www.khanacademy.org/login/' target='_blank'>logged in</a> to use this extension.</p></li>`;*/
        return;
      }

    // Log notifications for development purposes
    console.log(notifications);

    for await (const notification of notifications)
      fragment.appendChild(await createNotificationHTMLDivElement(notification));

    notificationsContainer.appendChild(fragment);

    console.log(notificationsContainer);

    // Allow notification loading now that task is complete
    notLoading = true;
  });
}

// Clears all unread notifications
function markAllRead(): Promise<{ [key: string]: string }> {
  return new Promise((resolve, reject) => {
    getChromeFkey()
      .then((fkey) => graphQLFetch('clearBrandNewNotifications', fkey))
      .then(async (response) => {
        const json = await response.json();
        if(json.data.clearBrandNewNotifications.error?.code === 'UNAUTHORIZED') {
          reject();
        } else {
          resolve(json);
        }
      })
      .catch(reject)
  });
}

// Updates the UI based on current theme
function updateFromTheme(): void {
  if(notificationsTheme === 'light') {
    themeButton.innerHTML = '<svg stroke="#ffffff" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="18px" width="18px" xmlns="http://www.w3.org/2000/svg"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
    document.body.className = "light";
  } else {
    themeButton.innerHTML = '<svg stroke="#ffffff" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="18px" width="18px" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
    document.body.className = 'dark';
  }
}