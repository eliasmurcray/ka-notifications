import gqlQueries from "../json/graphql-queries.json";

export function graphQLFetch (queryName: string, fkey: string, variables: {} = {}): Promise<Response> {
  return new Promise((resolve, reject) => {
    fetch("https://www.khanacademy.org/api/internal/graphql/" + queryName + "?/math/", {
      method: "POST",
      headers: {
        "X-KA-fkey": fkey,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        operationName: queryName,
        query: gqlQueries[queryName],
        variables
      }),
      credentials: "same-origin"
    })
      .then(async (response: Response) => {
        if (response.status === 200) {
          return resolve(response);
        }
        reject(`Error in GraphQL ${queryName} call: Server responded  with status ${response.status} and body ${JSON.stringify(await response.text())}`);
      })
      .catch(reject);
  });
}

export function getChromeFkey (): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.cookies.get({
      url: "https://www.khanacademy.org",
      name: "fkey"
    }, (cookie) => {
      if (cookie === null) {
        reject("Error: No fkey cookie found.");
      }
      resolve(cookie.value);
    });
  });
}
