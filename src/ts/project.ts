import { GraphQLBody } from "../@types/graphql";
import { blacklist } from "../util/blacklist";

blacklist();

/*
  Make comments load 100 at a time
*/
const originalFetch = fetch;

window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (input instanceof URL) {
    return originalFetch(input, init);
  }

  const request = input as Request;

  const { url } = request;
  const khanAcademyApiUrl =
    "https://www.khanacademy.org/api/internal/graphql/getFeedbackRepliesPage";

  if (!url?.startsWith(khanAcademyApiUrl)) {
    try {
      return await originalFetch(input, init);
    } catch (error) {
      console.error("Error:", error);
      return new Response(null, {
        status: 500,
        statusText: "Internal Server Error",
      });
    }
  }

  return new Promise(async (resolve) => {
    const blob = await request.blob();

    const reader = new FileReader();
    reader.onload = async () => {
      const contents = reader.result as string;
      const graphQLBody = JSON.parse(atob(contents.split(",")[1])) as GraphQLBody;

      // Increase comment load amount to 100
      graphQLBody.variables.limit = 100;

      const requestInit: RequestInit = {
        body: JSON.stringify(graphQLBody),
        cache: request?.cache,
        credentials: request?.credentials,
        headers: request?.headers,
        integrity: request?.integrity,
        keepalive: request?.keepalive,
        method: request?.method,
        mode: request?.mode,
        redirect: request?.redirect,
        referrer: request?.referrer,
        referrerPolicy: request?.referrerPolicy,
        signal: request?.signal,
      };
      const updatedRequest = new Request(request.url, requestInit);
      resolve(originalFetch(updatedRequest));
    };
    reader.readAsDataURL(blob);
  });
};

/*
  Update starting T&T tab based on query params
 */
const qaExpandType = new URLSearchParams(window.location.search).get("qa_expand_type");
let i = 0;
let button: HTMLButtonElement;

requestAnimationFrame(goToFeedback);

function goToFeedback() {
  if (++i > 100000) {
    return;
  }
  switch (qaExpandType) {
    case "question":
    case "answer":
      button = document.getElementById(
        "ka-uid-discussiontabbedpanel-0--tabbedpanel-tab-0",
      ) as HTMLButtonElement;
      break;
    case "comment":
    case "reply":
    case null:
      button = document.getElementById(
        "ka-uid-discussiontabbedpanel-0--tabbedpanel-tab-1",
      ) as HTMLButtonElement;
      break;
    case "project_help_question":
      button = document.getElementById(
        "ka-uid-discussiontabbedpanel-0--tabbedpanel-tab-2",
      ) as HTMLButtonElement;
      break;
  }

  if (button === null) {
    return requestAnimationFrame(goToFeedback);
  }

  button.click();
  window.scrollTo({ top: 0 });
}
