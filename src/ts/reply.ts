import {requestToRequestInit} from '../util/request';

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
          let newRequest = new Request(request.url, {
            ...requestToRequestInit(request),
            body: JSON.stringify(obj)
          });
          let newFetch = originalFetch(newRequest)
          resolve(newFetch);
        };
        reader.readAsDataURL(blob);
      });
    } else {
      resolve(originalFetch(request, requestInit));
    }
  });
};
