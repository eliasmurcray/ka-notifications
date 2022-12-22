import queries from "../graphql-queries.json";

/*
{
  "__typename": "ProgramFeedbackNotification",
  "authorAvatarSrc": "https://cdn.kastatic.org/images/avatars/svg/old-spice-man.svg",
  "authorNickname": "John",
  "brandNew": true,
  "class_": [
    "BaseNotification",
    "ReadableNotification",
    "BaseFeedbackNotification",
    "ScratchpadFeedbackNotification"
  ],
  "content": "It's always a good day when Polar posts",
  "date": "2022-12-22T04:10:25.032488Z",
  "feedbackType": "COMMENT",
  "kaid": "kaid_80710011086149831327935",
  "read": false,
  "translatedScratchpadTitle": "Gimbal.js",
  "url": "/computer-programming/gimbaljs/6426176054149120?qa_expand_key=ag5zfmtoYW4tYWNhZGVteXJBCxIIVXNlckRhdGEiHmthaWRfOTY0MjAxNDc0MzQyODQ1NjU4ODkxMzIwMQwLEghGZWVkYmFjaxiAgOPnyufUCww&qa_expand_type=comment",
  "urlsafeKey": "ag5zfmtoYW4tYWNhZGVteXIdCxIQQmFzZU5vdGlmaWNhdGlvbhiAgOOn87i3Cgw"
}
 */

getUserNotifications().then((notifications) => {
  let pre = document.createElement("pre");
  pre.innerText = JSON.stringify(notifications, null, "  ");
  document.body.append(pre);
});

async function* cursorList(query, getVars, findCursor, findList, pageCap) {
  let i = 0, complete = false, cursor = "";
  for (; !complete && (pageCap === undefined || i < pageCap); i++) {
    const vars = getVars(cursor);
    const results = await graphQLFetch(query, await getChromeFkey(), vars);
    ({ complete, cursor } = findCursor(results));
    yield findList(results);
  }
  return i;
}



function updateNewNotifications() {
  
}

function getUserNotifications() {
  return getChromeFkey().then(async (fkey) => (await graphQLFetch("getNotificationsForUser", fkey)).data.user.notifications.notifications);
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

function timeSince(date) {

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
}