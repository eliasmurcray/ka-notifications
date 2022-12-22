import queries from "../graphql-queries.json";

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