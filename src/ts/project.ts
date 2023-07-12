import { GraphQLBody } from "../@types/graphql";
import { requestToRequestInit } from "../util/request";

/*
  Make comments load 100 at a time
*/
const originalFetch = fetch;
window.fetch = async function (request: Request, requestInit: RequestInit): Promise<Response> {
  if (!request?.url?.startsWith("https://www.khanacademy.org/api/internal/graphql/getFeedbackRepliesPage")) {
    return originalFetch(request, requestInit).catch(Math.abs) as Promise<Response>;
  }

  return new Promise(async (resolve) => {
    const blob = await request.blob();

    const reader = new FileReader();
    reader.onload = async () => {
      const contents = reader.result as string;
      const graphQLBody = JSON.parse(atob(contents.split(",")[1])) as GraphQLBody;

      // Increase comment load amount to 100
      graphQLBody.variables.limit = 100;
      const updatedRequest = new Request(request.url, {
        ...requestToRequestInit(request),
        body: JSON.stringify(graphQLBody),
      });
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

if (qaExpandType !== null) {
  requestAnimationFrame(goToFeedback);
}

function goToFeedback() {
  if (i++ > 10000) {
    return;
  }
  switch (qaExpandType) {
    case "question":
    case "answer":
      button = document.getElementById("ka-uid-discussiontabbedpanel-0--tabbedpanel-tab-0") as HTMLButtonElement;
      break;
    case "comment":
    case "reply":
      button = document.getElementById("ka-uid-discussiontabbedpanel-0--tabbedpanel-tab-1") as HTMLButtonElement;
      break;
    case "project_help_question":
      button = document.getElementById("ka-uid-discussiontabbedpanel-0--tabbedpanel-tab-2") as HTMLButtonElement;
      break;
  }

  if (button === null) {
    return requestAnimationFrame(goToFeedback);
  }

  button.click();
}
