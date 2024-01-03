const split = window.location.pathname.split("/");

// Project page
if (
	(split[1] === "computer-programming" || split[1] === "cs") &&
	/^\d{16}$/.test(split[3].split("?")[0])
) {
	// Set feedback tab based on expand type
	const qaExpandType = new URLSearchParams(window.location.search).get("qa_expand_type");
	let iter = 10000; // Retry amount
	const openFeedbackTab = () => {
		if (!--iter) return;
		let button;

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

		if (!button || !(button instanceof HTMLButtonElement)) {
			window.requestAnimationFrame(openFeedbackTab);
			return;
		}

		button.click();
		window.scrollTo(0, 0);

		// Auto sort comments
		chrome.storage.local.get("defaultCommentSort", ({ defaultCommentSort }) => {
			if (!defaultCommentSort) return;
			iter = 10000; // Retry amount
			const setCommentSort = () => {
				if (!--iter) return;
				const button = document.getElementById("sortBy");
				if (!button || !(button instanceof HTMLButtonElement)) {
					window.requestAnimationFrame(setCommentSort);
					return;
				}
				button.click();

				const sortButtons = document.querySelectorAll<HTMLButtonElement>(
					"div[data-test-id='dropdown-core-container'] button",
				);
				sortButtons.forEach((btn) => {
					if (btn.innerHTML.includes(defaultCommentSort)) {
						btn.click();
					}
				});
				window.scrollTo(0, 0);
				button.blur();
			};
			setCommentSort();
		});
	};

	window.requestAnimationFrame(openFeedbackTab);

	// Fetch 100 comments at a time instead of 10
	const oldFetch = fetch;

	window.fetch = async function (
		input: RequestInfo | URL,
		init?: RequestInit,
	): Promise<Response> {
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
}
