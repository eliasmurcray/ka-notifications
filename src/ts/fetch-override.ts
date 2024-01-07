// Fetch 100 comments at a time instead of 10
const oldFetch = fetch;

window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
	if (input instanceof URL || input instanceof String) {
		return oldFetch(input, init);
	}

	if (!(input instanceof Request)) {
		return new Response(null);
	}

	if (
		!input.url?.startsWith(
			"https://www.khanacademy.org/api/internal/graphql/getFeedbackRepliesPage",
		)
	) {
		try {
			return await oldFetch(input, init);
		} catch (error) {
			return new Response(null, {
				status: 500,
				statusText: "Internal Server Error",
			});
		}
	}

	return new Promise(async (resolve) => {
		const blob = await input.blob();

		const reader = new FileReader();
		reader.onload = async () => {
			const contents = reader.result as string;
			const graphQLBody = JSON.parse(atob(contents.split(",")[1]));

			// Increase comment load amount to 100
			graphQLBody.variables.limit = 100;

			const requestInit: RequestInit = {
				body: JSON.stringify(graphQLBody),
				cache: input?.cache,
				credentials: input?.credentials,
				headers: input?.headers,
				integrity: input?.integrity,
				keepalive: input?.keepalive,
				method: input?.method,
				mode: input?.mode,
				redirect: input?.redirect,
				referrer: input?.referrer,
				referrerPolicy: input?.referrerPolicy,
				signal: input?.signal,
			};
			const updatedRequest = new Request(input.url, requestInit);
			resolve(oldFetch(updatedRequest));
		};
		reader.readAsDataURL(blob);
	});
};
