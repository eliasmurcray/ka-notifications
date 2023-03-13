import QUERIES from '../json/graphql-queries.json';

const originalFetch = fetch;
window.fetch = function(request: Request, requestInit: RequestInit): Promise<Response> {
  return new Promise((resolve) => {
    let url = request.url;
    if (url?.startsWith('https://www.khanacademy.org/api/internal/graphql/getFeedbackRepliesPage')) {
      request.blob()
      .then((blob) => {
        let reader = new FileReader();
        reader.onloadend = () => {
          let result = reader.result as string;
          let json = atob(result.split(',')[1]);
          let obj = JSON.parse(json);
          obj.variables.limit = 100;
          let fkey = getCookie('fkey');
          let newFetch = graphQLFetch('getFeedbackRepliesPage', fkey, obj.variables);
          resolve(newFetch);
        };
        reader.readAsDataURL(blob);
      });
    } else {
      resolve(originalFetch(request, requestInit));
    }
  });
};

function graphQLFetch(query: string, fkey: string, variables = {}): Promise<Response> {
  return originalFetch('https://www.khanacademy.org/api/internal/graphql/' + query + '?/math/', {
    method: 'POST',
    headers: {
      'X-KA-fkey': fkey,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      operationName: query,
      query: QUERIES[query],
      variables
    }),
    credentials: 'same-origin'
  });
}

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}