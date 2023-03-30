import {requestToRequestInit} from "../util/request";

const originalFetch = fetch;
window.fetch = function (request: Request, requestInit: RequestInit): Promise<Response> {
	return new Promise((resolve) => {
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
			resolve(originalFetch(request, requestInit));
		}
	});
};
