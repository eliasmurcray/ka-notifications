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
	};

	window.requestAnimationFrame(openFeedbackTab);

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
		};
		setCommentSort();
	});
}
