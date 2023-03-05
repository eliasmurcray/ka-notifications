import QUERIES from "../graphql-queries.json";

const originalFetch = fetch;
window.fetch = function(request: Request) {
  return new Promise((resolve) => {
    let url = request.url;
    if (url?.startsWith("https://www.khanacademy.org/api/internal/graphql/getFeedbackRepliesPage")) {
      request.blob()
      .then((blob) => {
        let reader = new FileReader();
        reader.onloadend = async () => {
          let result = reader.result as string;
          let json = atob(result.split(',')[1]);
          let obj = JSON.parse(json);
          let { postKey } = obj.variables;
          let fkey = getCookie("fkey");
          let newFetch = graphQLFetch("getFeedbackRepliesPage", fkey, { postKey, limit: 100 });
          resolve(newFetch);
        };
        reader.readAsDataURL(blob);
      });
    } else {
      resolve(originalFetch(request));
    }
  });
};


function graphQLFetch(query: string, fkey: string, variables = {}): Promise<Response> {
  return originalFetch("https://www.khanacademy.org/api/internal/graphql/" + query + "?/math/", {
    method: "POST",
    headers: {
      "X-KA-fkey": fkey,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      operationName: query,
      query: QUERIES[query],
      variables
    }),
    credentials: "same-origin"
  });
}

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}