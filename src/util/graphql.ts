import { StringMap } from "../@types/common-types";
import {
  GeneralResponse,
  FeedbackRequestType,
  FeedbackResponseType,
  graphQLVariables,
} from "../@types/extension";
import { FeedbackQueryResponse } from "../@types/graphql";
import * as graphQLQueriesJson from "../json/graphql-queries.json";
import { getLatestMutation, getLatestQuery } from "@bhavjit/khan-api";

const graphQLQueries: StringMap = { ...graphQLQueriesJson };

/**
 * Executes a fetch to Khan Academy's GraphQL API.
 *
 * @param queryName - The name of the GraphQL query.
 * @param fkey - The authorization key used for requests.
 * @param variables - The inputs for the GraphQL function.
 * @returns A Promise that resolves with the response or rejects if the fetch fails.
 */
export async function graphQLFetch(
  queryName: string,
  fkey: string,
  variables: graphQLVariables = {},
): Promise<Response> {
  const requestUrl = `https://www.khanacademy.org/api/internal/graphql/${queryName}?/fastly/`;

  // British request object
  const requestInit: RequestInit = {
    method: "POST",
    headers: {
      "X-KA-fkey": fkey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      operationName: queryName,
      query: graphQLQueries[queryName],
      variables,
    }),
    credentials: "same-origin",
  };

  const response = await fetch(requestUrl, requestInit);

  if (response.status === 200) {
    return response;
  } else if (response.status === 400) {
    const isMutation = graphQLQueries[queryName].startsWith("mutation");
    console.warn(
      `The query for operation "${queryName}" is no longer in the safelist. Attempting to fetch the latest version from the safelist...`,
    );

    const latestQuery = isMutation
      ? await getLatestMutation(queryName)
      : await getLatestQuery(queryName);

    if (!latestQuery) {
      throw new Error(`The query for operation "${queryName}" was not found in the safelist`);
    }

    requestInit.body = JSON.stringify({
      operationName: queryName,
      query: latestQuery,
      variables,
    });

    const updatedResponse = await fetch(requestUrl, requestInit);

    if (updatedResponse.status === 200) {
      graphQLQueries[queryName] = latestQuery;
      return updatedResponse;
    } else {
      throw new Error(
        `Error in GraphQL "${queryName}" call: Server responded with status ${updatedResponse.status}.`,
      );
    }
  } else {
    throw new Error(
      `Error in GraphQL "${queryName}" call: Server responded with status ${response.status}.`,
    );
  }
}

/**
 * Retrieves user fkey cookie from Khan Academy.
 * @returns fkey cookie value or rejects if no cookie was found.
 */
export async function getUserFkeyCookie(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    chrome.cookies.get(
      {
        url: "https://www.khanacademy.org",
        name: "fkey",
      },
      (cookie) => {
        if (cookie === null) {
          reject("No fkey cookie found.");
        } else {
          resolve(cookie.value);
        }
      },
    );
  });
}

/**
 * Better error handling for graphQL calls.
 * @param queryName graphQL query name.
 * @param fkey cookie is required to make requests.
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
  fkey: string,
  variables: graphQLVariables = {},
): Promise<GeneralResponse> {
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

  try {
    const response = await graphQLFetch(queryName, cookie, variables);
    const data = await response.json();

    return { value: data };
  } catch (error) {
    if (error instanceof Error && error.message === "Failed to fetch") {
      console.log("Possible network disconnect detected, please check your internet connection.");
    } else {
      console.error("Error in response: ", error);
    }

    return { value: null };
  }
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
export async function addFeedback(
  fkey: string,
  url: string,
  typename: string,
  feedbackType: string,
  textContent: string,
): Promise<boolean> {
  try {
    const params = new URL("https://www.khanacademy.org/" + url).searchParams;
    let requestType: FeedbackRequestType;
    let responseType: FeedbackResponseType;
    let focusKind = "scratchpad";

    if (typename === "ResponseFeedbackNotification") {
      requestType = feedbackType === "ANSWER" ? "QUESTION" : "COMMENT";
      responseType = "REPLY";
      focusKind = params.get("qa_expand_type") as string;
    } else if (typename === "ProgramFeedbackNotification") {
      requestType = feedbackType as FeedbackRequestType;
      responseType = feedbackType === "QUESTION" ? "ANSWER" : "REPLY";
    } else {
      return false;
    }

    const topicId = url.split("?")[0].split("/").pop();

    const feedbackResponse = await graphQLFetch("feedbackQuery", fkey, {
      topicId,
      feedbackType: requestType,
      currentSort: 5,
      qaExpandKey: params.get("qa_expand_key") as string,
      focusKind,
    });

    const feedbackJson: FeedbackQueryResponse = await feedbackResponse.json();
    const feedback = feedbackJson.data.feedback.feedback[0];

    const key =
      feedbackType === "QUESTION" && params.get("qa_expand_type") === "answer"
        ? feedback.answers[0].key
        : feedback.key;

    const addFeedbackResponse = await graphQLFetch("AddFeedbackToDiscussion", fkey, {
      parentKey: key,
      textContent,
      feedbackType: responseType,
      fromVideoAuthor: false,
      shownLowQualityNotice: false,
    });

    return addFeedbackResponse.ok;
  } catch (error) {
    console.error("Error in sending feedback: ", error);
    return false;
  }
}
