import { requestToRequestInit } from "../util/request";

const originalFetch = fetch;
window.fetch = function (request: Request, requestInit: RequestInit): Promise<Response> {
  return new Promise<Response>((resolve, reject) => {
    const url = request.url;
    if (url?.startsWith("https://www.khanacademy.org/api/internal/graphql/getFeedbackRepliesPage")) {
      request.blob()
        .then((blob) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            const json = atob(result.split(",")[1]);
            const obj = JSON.parse(json);
            obj.variables.limit = 100;
            const newRequest = new Request(request.url, {
              ...requestToRequestInit(request),
              body: JSON.stringify(obj)
            });
            const newFetch = originalFetch(newRequest);
            resolve(newFetch);
          };
          reader.readAsDataURL(blob);
        });
    } else {
      originalFetch(request, requestInit)
        .then((response) => {
          resolve(response);
        })
        .catch((error) => {
          reject(error);
        });
    }
  }).catch(() => Promise.reject(new Response(null)));
};

const params = new URLSearchParams(window.location.search);
const qa_expand_type = params.get("qa_expand_type");
console.log(qa_expand_type);

requestAnimationFrame(goToFeedback);
function goToFeedback() {
  let button: HTMLButtonElement;
  switch(qa_expand_type) {
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

  if(button === null) return requestAnimationFrame(goToFeedback);
  button.click();
}