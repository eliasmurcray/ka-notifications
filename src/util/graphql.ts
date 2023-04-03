import { graphQLVariables } from "../@types/extension";
import graphQLQueries from "../json/graphql-queries.json";

export function graphQLFetch (queryName: string, fkey: string, variables: graphQLVariables = {}): Promise<Response> {
  return new Promise((resolve, reject) => {
    fetch("https://www.khanacademy.org/api/internal/graphql/" + queryName, {
      method: "POST",
      headers: {
        "X-KA-fkey": fkey,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        operationName: queryName,
        query: graphQLQueries[queryName] as string,
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
        reject("No fkey cookie found.");
      }
      resolve(cookie.value);
    });
  });
}
