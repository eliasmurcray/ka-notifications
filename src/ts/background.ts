import { createNotificationString } from '../util/notifications';
import { graphQLFetch, getChromeFkey } from '../util/graphql';

// Set background color of badge to teal
chrome.action.setBadgeBackgroundColor({
  color: '#00BFA5'
});

// Add event listener to user logout sessions
chrome.cookies.onChanged.addListener(({ cookie, removed }) => {
  if(cookie.name === 'KAAS')
    if(removed === true) {
      chrome.action.setBadgeText({ text: '!' });
    } else {
      chrome.action.setBadgeText({ text: '' });
      checkForNewNotifications();
    }
});

const ALARM_NAME: string = 'khanAcademyNotifications';

// When alarm 'khanAcademyNotifications' goes off, check for new notifications
chrome.alarms.onAlarm.addListener(({ name }) => {
  if(name === ALARM_NAME) checkForNewNotifications();
  console.log('Alarm ' + name + ' fired.');
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
      graphQLFetch('getFullUserProfile', fkey)
      .then(async (response) => {
        const json = await response.json();
        const { data: { user } } = json;

        // If user is not logged in show an error
        if(user === null)
          return chrome.action.setBadgeText({ text: '!' });
        
        // Or else, update notification count
        const { newNotificationCount } = user;

        if(newNotificationCount > 0) {
          // Preload data
          graphQLFetch('getNotificationsForUser', fkey)
          .then(async (response) => {
            const json = await response.json();
            const { data: { user: { notifications } } } = json;
            console.log(notifications);
            const cursor = notifications.pageInfo.nextCursor;
            const preloadString = notifications.notifications.map(createNotificationString).join('');
            chrome.storage.local.set({ notificationsCache: { cursor, preloadString } });
            chrome.action.setBadgeText({ text: newNotificationCount > 99 ? '99+' : String(newNotificationCount) });
          })
          .catch((error) => {
            console.error('Error code 2: ' + error);
            chrome.action.setBadgeText({ text: '!' });
          });
        } else {
          chrome.action.setBadgeText({ text: '' });
        }
      })
      .catch((error) => {
        chrome.action.setBadgeText({ text: '!' });
        console.error('Error code 3: ' + error);
      });
  })
}