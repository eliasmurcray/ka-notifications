import { graphQLVariables } from "../@types/extension";
import graphQLQueries from "../json/graphql-queries.json";

/**
 * Executes a fetch to Khan Academy's GraphQL API.
 *
 * @param queryName - The name of the GraphQL query.
 * @param kaas - The authorization key used for requests.
 * @param variables - The inputs for the GraphQL function.
 * @returns A Promise that resolves with the response or rejects if the fetch fails.
 */
export function graphQLFetch(
  queryName:
    | "AddFeedbackToDiscussion"
    | "clearBrandNewNotifications"
    | "feedbackQuery"
    | "getFeedbackRepliesPage"
    | "getFullUserProfile"
    | "getNotificationsForUser",
  kaas: string,
  variables: graphQLVariables = {}
): Promise<Response> {
  return new Promise((resolve, reject) => {
    // Implement fastly phrase to match safelist regex, pushing ratelimit to 100 tps for any Khan Academy GraphQL call
    fetch(
      "https://www.khanacademy.org/api/internal/graphql/" +
        queryName +
        "?/_fastly/",
      {
        method: "POST",
        headers: {
          "X-KA-fkey": "a",
          "Content-Type": "application/json",
          Cookie: `fkey=a;kaas=${kaas}`,
        },
        body: JSON.stringify({
          operationName: queryName,
          query: graphQLQueries[queryName],
          variables,
        }),
        credentials: "same-origin",
      }
    )
      .then(async (response: Response) => {
        if (response.status === 200) {
          return resolve(response);
        }
        reject(
          `Error in GraphQL "${queryName}" call: Server responded  with status ${response.status}.`
        );
      })
      .catch(reject);
  });
}

export function getUserKaasCookie(): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.cookies.get(
      {
        url: "https://www.khanacademy.org",
        name: "KAAS",
      },
      (cookie) => {
        if (cookie === null) {
          return reject("No KAAS cookie found.");
        }
        resolve(cookie.value);
      }
    );
  });
}
