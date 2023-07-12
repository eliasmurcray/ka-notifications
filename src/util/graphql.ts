import { GeneralResponse, graphQLVariables } from "../@types/extension";
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

/**
 * Retrieves user KAAS cookie from Khan Academy.
 * @returns KAAS cookie value or rejects if no cookie was found.
 */
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

/**
 * Better error handling for graphQL calls.
 * @param queryName graphQL query name.
 * @param kaas cookie is required to make requests.
 * @returns Returns an object with either an error or a JSON value
 */
export async function graphQLFetchJsonResponse(
  queryName:
    | "AddFeedbackToDiscussion"
    | "clearBrandNewNotifications"
    | "feedbackQuery"
    | "getFeedbackRepliesPage"
    | "getFullUserProfile"
    | "getNotificationsForUser",
  kaas: string
): Promise<GeneralResponse> {
  // Optimized cookie retrieval
  let cookie: string;
  if (kaas !== undefined) {
    cookie = kaas;
  } else {
    try {
      cookie = await getUserKaasCookie();
    } catch (e) {
      return {
        cookieError: true,
      };
    }
  }

  // Attempts to fetch data and handles common errors
  let response: Response;
  try {
    response = await graphQLFetch(queryName, cookie);
  } catch (e) {
    // It's possible you disconnected mid-fetch
    if (e.message === "Failed to fetch") {
      console.log(
        "Possible network disconnect detected, please check your internet connection."
      );
      return;
    }

    // Otherwise you have a geniune network error
    console.error("Error in response: ", e.message);
    return;
  }

  return {
    value: await response.json(),
  };
}
