import queries from "../graphql-queries.json";
import "../css/popup.css";

getNextNotifications();
function getNextNotifications() {
  window.notificationsLoader = getUserNotifications();
  window.notificationsLoader.next().then(({ value: notifications }) => {
    let pre = document.createElement("pre");
    pre.innerText = JSON.stringify(notifications, null, "  ");
    document.body.append(pre);
  });
}

// Returns generator function that gets user notifications
async function* getUserNotifications() {
  let i = 0;
  let complete = false;
  let cursor = "";
  for(;!complete; i++) {
    // Retrieve user notifications as JSON
    const json = (await graphQLFetch("getNotificationsForUser", await getChromeFkey(), { after: cursor })).data;

    // Retrieve a cursor from the JSON
    const nextCursor = json.user.notifications.pageInfo.nextCursor;

    // Update loop control variables
    complete = !nextCursor;
    cursor = nextCursor ?? "";

    // Return this set of notifications as JSON
    yield json.user.notifications.notifications;
  }
  return i;
}

function graphQLFetch(query, fkey, variables = {}) {
  return new Promise((resolve, reject) => {
    fetch("https://www.khanacademy.org/api/internal/graphql/_mt/" + query, {
      method: "POST",
      headers: {
        "X-KA-fkey": fkey,
        "content-type": "application/json",
        "variables": variables
      },
      body: JSON.stringify({
        operationName: query,
        query: queries[query]
      }),
      credentials: "same-origin"
    }).then(async (response) => {
      if (response.status === 200) return resolve(await response.json());
      response.text().then((body) => reject(`Error in GraphQL ${query} call: Server responded with status ${JSON.stringify(response.status)} and body ${JSON.stringify(body)}`));
    });
  });
}

function getChromeFkey() {
  return new Promise((resolve, reject) => {
    chrome.cookies.get({
      url: "https://www.khanacademy.org",
      name: "fkey"
    }, (cookie) => {
      if (cookie === null || !cookie) reject("fkey cookie not found.");
      resolve(cookie?.value);
    });
  });
}

/*function timeSince(date) {

  var seconds = Math.floor((new Date() - date) / 1000);

  var interval = seconds / 31536000;

  if (interval > 1) {
    return Math.floor(interval) + " years";
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + " months";
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + " days";
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + " hours";
  }
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + " minutes";
  }
  return Math.floor(seconds) + " seconds";
}*/