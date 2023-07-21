import { GeneralResponse, FeedbackRequestType, FeedbackResponseType, graphQLVariables } from "../@types/extension";
import { FeedbackQueryResponse } from "../@types/graphql";
import graphQLQueries from "../json/graphql-queries.json";

/**
 * Executes a fetch to Khan Academy's GraphQL API.
 *
 * @param queryName - The name of the GraphQL query.
 * @param fkey - The authorization key used for requests.
 * @param variables - The inputs for the GraphQL function.
 * @returns A Promise that resolves with the response or rejects if the fetch fails.
 */
export function graphQLFetch(queryName: "AddFeedbackToDiscussion" | "clearBrandNewNotifications" | "feedbackQuery" | "getFeedbackRepliesPage" | "getFullUserProfile" | "getNotificationsForUser", fkey: string, variables: graphQLVariables = {}): Promise<Response> {
  return new Promise((resolve, reject) => {
    // Implement fastly phrase to match safelist regex, pushing ratelimit to 100 tps for any Khan Academy GraphQL call
    fetch("https://www.khanacademy.org/api/internal/graphql/" + queryName + "?/fastly/", {
      method: "POST",
      headers: {
        "X-KA-fkey": fkey,
        "Content-Type": "application/json",
        // cookie: `fkey=a; fkey=${fkey}`,
      },
      body: JSON.stringify({
        operationName: queryName,
        query: graphQLQueries[queryName],
        variables,
      }),
      credentials: "same-origin",
    })
      .then(async (response: Response) => {
        if (response.status === 200) {
          return resolve(response);
        }
        reject(`Error in GraphQL "${queryName}" call: Server responded  with status ${response.status}.`);
      })
      .catch(reject);
  });
}

/**
 * Retrieves user fkey cookie from Khan Academy.
 * @returns fkey cookie value or rejects if no cookie was found.
 */
export function getUserFkeyCookie(): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.cookies.get(
      {
        url: "https://www.khanacademy.org",
        name: "fkey",
      },
      (cookie) => {
        if (cookie === null) {
          return reject("No fkey cookie found.");
        }
        resolve(cookie.value);
      }
    );
  });
}

/**
 * Better error handling for graphQL calls.
 * @param queryName graphQL query name.
 * @param fkey cookie is required to make requests.
 * @returns Returns an object with either an error or a JSON value
 */
export async function graphQLFetchJsonResponse(queryName: "AddFeedbackToDiscussion" | "clearBrandNewNotifications" | "feedbackQuery" | "getFeedbackRepliesPage" | "getFullUserProfile" | "getNotificationsForUser", fkey: string, variables: graphQLVariables = {}): Promise<GeneralResponse> {
  // Optimized cookie retrieval
  let cookie: string;
  if (fkey !== undefined) {
    cookie = fkey;
  } else {
    try {
      cookie = await getUserFkeyCookie();
    } catch (e) {
      return {
        cookieError: true,
      };
    }
  }

  // Attempts to fetch data and handles common errors
  let response: Response;
  try {
    response = await graphQLFetch(queryName, cookie, variables);
  } catch (e) {
    // It's possible you disconnected mid-fetch
    if (e.message === "Failed to fetch") {
      console.log("Possible network disconnect detected, please check your internet connection.");
      return;
    }

    // Otherwise you have a geniune network error
    console.error("Error in response: ", e);
    return;
  }

  return {
    value: await response.json(),
  };
}

/**
 * Sends feedback using notification properties.
 *
 * @param fkey User auth cookie
 * @param url KaNotification class property default
 * @param typename Typename of the KaNotification
 * @param feedbackType Type of feedback that this notification is
 * @param textContent The content you want to send
 * @returns A boolean that is true if the data was sent successfully
 */
export async function addFeedback(fkey: string, url: string, typename: string, feedbackType: string, textContent: string): Promise<boolean> {
  let responseType: FeedbackResponseType;
  let requestType: FeedbackRequestType;
  let focusKind = "scratchpad";

  const params = new URL("https://www.khanacademy.org/" + url).searchParams;

  if (typename === "ResponseFeedbackNotification") {
    requestType = feedbackType === "ANSWER" ? "QUESTION" : "COMMENT";
    responseType = "REPLY";
    focusKind = params.get("qa_expand_type");
  } else if (typename === "ProgramFeedbackNotification") {
    requestType = feedbackType as FeedbackRequestType;
    responseType = feedbackType === "QUESTION" ? "ANSWER" : "REPLY";
  } else {
    return false;
  }

  const topicId = url.split("?")[0].split("/").pop();

  return graphQLFetch("feedbackQuery", fkey, {
    topicId,
    feedbackType: requestType,
    currentSort: 5,
    qaExpandKey: params.get("qa_expand_key"),
    focusKind,
  })
    .then((response: Response) => response.json())
    .then(async (json: FeedbackQueryResponse) => {
      const feedback = json.data.feedback.feedback[0];
      const key: string = feedbackType === "QUESTION" && params.get("qa_expand_type") === "answer" ? feedback.answers[0].key : feedback.key;
      return graphQLFetch("AddFeedbackToDiscussion", fkey, {
        parentKey: key,
        textContent,
        feedbackType: responseType,
        fromVideoAuthor: false,
        shownLowQualityNotice: false,
      });
    })
    .then((response) => response.ok)
    .catch((error) => {
      console.error("Error in sending feedback: ", error);
      return false;
    });
}
