import { KhanAcademyNotification } from "../@types/notification";
import { StringMap } from "../@types/common-types";
import { getAuthToken, khanApiFetch } from "./khan-api";
import * as AVATAR_REQUIREMENTS_JSON from "../json/avatar-requirements.json";
import * as AVATAR_SHORTNAMES_JSON from "../json/avatar-shortnames.json";

const AVATAR_REQUIREMENTS: StringMap = AVATAR_REQUIREMENTS_JSON;
const AVATAR_SHORTNAMES: StringMap = AVATAR_SHORTNAMES_JSON;

/**
 * Constructs notification string from input Khan Academy notification object
 *
 * @param notification Khan Academy notification from GraphQL endpoint
 * @returns HTML parseable string to append to popup
 */
export function createNotificationString(notification: KhanAcademyNotification): string {
	const { brandNew, date, url } = notification;
	switch (notification.__typename) {
		case "ResponseFeedbackNotification":
			return `<li class="notification ${
				brandNew ? "new" : ""
			}"><div class="notification-header"><img class="notification-author-avatar" src="${
				notification.authorAvatarUrl
			}"><h3 class="notification-author-nickname">${cleanse(
				notification.authorNickname,
			)}</h3><a class="hyperlink" href="https://www.khanacademy.org${url}" target="_blank">${
				notification.feedbackType === "REPLY" ? "added a comment" : "answered your question"
			} on ${
				notification.focusTranslatedTitle
			}</a><span class="notification-date">${timeSince(
				new Date(date),
			)} ago</span></div><div class="notification-content">${parseMarkdown(
				notification.content,
			)}</div><div class="notification-feedback-container"><button class="notification-feedback-button add-listeners" data-url="${url}" data-typename="ResponseFeedbackNotification" data-feedbacktype="${
				notification.feedbackType
			}">Reply</button></div></li>`;
		case "ProgramFeedbackNotification":
			return `<li class="notification ${
				brandNew ? "new" : ""
			}"><div class="notification-header"><img class="notification-author-avatar" src="${
				notification.authorAvatarSrc
			}"><h3 class="notification-author-nickname">${cleanse(
				notification.authorNickname,
			)}</h3><a class="hyperlink" href="https://www.khanacademy.org${url}" target="_blank">${
				notification.feedbackType === "COMMENT" ? "commented" : "asked a question"
			} on ${cleanse(
				notification.translatedScratchpadTitle,
			)}</a><span class="notification-date">${timeSince(
				new Date(date),
			)} ago</span></div><div class="notification-content">${parseMarkdown(
				notification.content,
			)}</div><div class="notification-feedback-container"><button class="notification-feedback-button add-listeners" data-url="${url}" data-typename="ProgramFeedbackNotification" data-feedbacktype="${
				notification.feedbackType
			}">Reply</button></div></li>`;
		case "AvatarNotification":
			return `<li class="notification ${
				brandNew ? "new" : ""
			}"><div class="notification-header"><img class="notification-author-avatar" src="${
				notification.thumbnailSrc.startsWith("https://cdn.kastatic.org/")
					? notification.thumbnailSrc
					: "https://cdn.kastatic.org" + notification.thumbnailSrc
			}"><h3 class="notification-author-nickname">KA Avatars</h3><a class="hyperlink" href="https://www.khanacademy.org${url}" target="_blank">use avatar</a><span class="notification-date">${timeSince(
				new Date(date),
			)} ago</span></div><div class="notification-content">You unlocked <b>${
				AVATAR_SHORTNAMES[notification.name]
			}</b>! <i>${AVATAR_REQUIREMENTS[notification.name]}</i></div></li>`;
		case "GroupedBadgeNotification":
			return `<li class="notification ${
				brandNew ? "new" : ""
			}"><div class="notification-header"><img class="notification-author-avatar" src="${
				notification.badgeNotifications[0].badge.icons.compactUrl
			}"><h3 class="notification-author-nickname">KA Badges</h3><a class="hyperlink" href="https://www.khanacademy.org${
				notification.url
			}" target="_blank">view badges</a><span class="notification-date">${timeSince(
				new Date(date),
			)} ago</span></div><p class="notification-content">You earned <b>${
				notification.badgeNotifications[0].badge.description
			}</b> and ${
				notification.badgeNotifications.length - 1
			} more! Congratulations!</p></li>`;
		case "BadgeNotification":
			return `<li class="notification ${
				brandNew ? "new" : ""
			}"><div class="notification-header"><img class="notification-author-avatar" src="${
				notification.badge.icons.compactUrl
			}"><h3 class="notification-author-nickname">KA Badges</h3><a class="hyperlink" href="https://www.khanacademy.org/${
				notification.badge.relativeUrl
			}" target="_blank">view badge</a><span class="notification-date">${timeSince(
				new Date(date),
			)}</span></div><div class="notification-content">You earned <b>${
				notification.badge.description
			}</b>! <i>${notification.badge.fullDescription}</i>.</div></li>`;
		case "ModeratorNotification":
			return `<li class="notification ${
				brandNew ? "new" : ""
			}><div class="notification-header"><img class="notification-author-avatar" src="guardian-icon.png"><h3 class="notification-author-nickname">KA Guardian</h3><span class="notification-date">${timeSince(
				new Date(date),
			)}</span></div><div class="notification-content">${parseMarkdown(
				notification.text,
			)}</div></li>`;
		default:
			console.log(`Notification type ${notification.__typename} is currently unsupported.`);
			return `<li class="notification ${
				brandNew ? "new" : ""
			}"><div class="notification-header"><img class="notification-author-avatar" src="48.png"><h3 class="notification-author-nickname">Unsupported Notification Type</h3><span class="notification-date">${timeSince(
				new Date(date),
			)} ago</span></div><div class="notification-content">${JSON.stringify(
				notification,
			)}</div></li>`;
	}
}

/**
 * Converts markdown string into a formatted HTML string which can be used as an HTML insert.
 *
 * @param text Input string to parse to HTML markdown
 * @returns A formatted HTML string
 */
function parseMarkdown(text: string) {
	text = cleanse(text);

	const codeBlocks: string[] = [];
	const codeInlines: string[] = [];

	// Store code blocks
	text = text.replace(/```([\s\S]*?)```/gm, (_match, codeBlock) => {
		codeBlocks.push(codeBlock);
		return `<codeblock-placeholder-${codeBlocks.length - 1}>`;
	});

	// Store code inlines
	text = text.replace(/`([^\n]+?)`/g, (_match, codeInline) => {
		codeInlines.push(codeInline);
		return `<codeinline-placeholder-${codeInlines.length - 1}>`;
	});

	let originalText = text;
	for (let i = 0; i < 100; i++) {
		// Bolds
		text = text.replace(/\*([^\n]+?)\*/g, "<b>$1</b>");
		// Italics
		text = text.replace(/_([^\n]+?)_/g, "<i>$1</i>");
		// Strikethroughs
		text = text.replace(/~([^\n]+?)~/g, "<s>$1</s>");
		if (text === originalText) {
			break;
		}
		originalText = text;
	}

	// Restore code blocks
	text = text.replace(
		/<codeblock-placeholder-(\d+)>/g,
		(_match, index) => `<pre><code>${codeBlocks[parseInt(index)]}</code></pre>`,
	);

	// Restore code inlines
	text = text.replace(
		/<codeinline-placeholder-(\d+)>/g,
		(_match, index) => `<code>${codeInlines[parseInt(index)]}</code>`,
	);

	// URLs
	text = text.replace(
		/((?:http|https)(?:.*?))(?:\s|$)/g,
		'<a class="hyperlink" href="$1" target="_blank">$1</a>',
	);

	// @mentions (username 40 length max)
	text = text.replace(
		/@([a-zA-Z][a-zA-Z\d]{0,39})/g,
		'<a class="hyperlink" href="https://www.khanacademy.org/profile/$1" target="_blank">@$1</a>',
	);

	return text;
}

/**
 * Cleans HTML tags from input
 *
 * @param text Input text
 * @returns HTML tag escaped text
 */
function cleanse(text: string): string {
	return text.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;");
}

/**
 * Compares input date with current date and returns a human-readable string representing the difference.
 * @param date The input date to compare.
 * @returns The time difference in a human-readable string.
 */
function timeSince(date: Date): string {
	const seconds = ((new Date().getTime() - date.getTime()) / 1000) | 0;

	if (seconds < 60) {
		return `${seconds} second${seconds === 1 ? "" : "s"}`;
	}

	if (seconds < 3600) {
		const minutes = (seconds / 60) | 0;
		return `${minutes} minute${minutes === 1 ? "" : "s"}`;
	}

	if (seconds < 86400) {
		const hours = (seconds / 3600) | 0;
		return `${hours} hour${hours === 1 ? "" : "s"}`;
	}

	if (seconds < 2592000) {
		const days = (seconds / 86400) | 0;
		return `${days} day${days === 1 ? "" : "s"}`;
	}

	if (seconds < 31536000) {
		const months = (seconds / 2592000) | 0;
		return `${months} month${months === 1 ? "" : "s"}`;
	}

	const years = (seconds / 31536000) | 0;
	return `${years} year${years === 1 ? "" : "s"}`;
}

export function addReplyButtonEventListeners(): void {
	const replyButtons = document.getElementsByClassName(
		"add-listeners",
	) as HTMLCollectionOf<HTMLButtonElement>;
	for (let i = replyButtons.length; i--; ) {
		replyButtons[i].onclick = handleReplyButtonClick;
		replyButtons[i].className = "notification-feedback-button";
	}
}

function handleReplyButtonClick(event: MouseEvent): void {
	// If there is an active textarea, reset it before creating a new one
	const oldTextarea = document.getElementById("active-textarea") as HTMLTextAreaElement;
	if (oldTextarea) {
		const btn = oldTextarea.parentElement!.getElementsByClassName(
			"notification-feedback-button",
		)[0] as HTMLButtonElement;
		btn.onclick = handleReplyButtonClick;
		btn.textContent = "Reply";
		oldTextarea.remove();
	}

	const btn = event.target as HTMLButtonElement;
	btn.onclick = sendMessage;
	btn.textContent = "Cancel";
	const textarea = document.createElement("textarea");
	textarea.id = "active-textarea";
	textarea.oninput = () => {
		if (textarea.value.length === 0) {
			btn.textContent = "Cancel";
		} else {
			btn.textContent = "Send";
		}
		textarea.style.height = "0";
		textarea.style.height = `${textarea.scrollHeight + 2}px`;
	};
	btn.insertAdjacentElement("beforebegin", textarea);
	textarea.focus();
}

async function sendMessage(event: MouseEvent): Promise<void> {
	const btn = event.target as HTMLButtonElement;
	const textarea = document.getElementById("active-textarea") as HTMLTextAreaElement;
	if (!textarea || textarea.value.length === 0) {
		btn.onclick = handleReplyButtonClick;
		btn.innerText = "Reply";
		textarea.remove();
		return;
	}

	btn.textContent = "Sending...";
	textarea.disabled = true;

	function handleError(message: string) {
		console.log("Error in sending message: " + message);
		textarea.value = "Error in sending message: " + message;
		btn.textContent = "Error";
	}

	const token = await getAuthToken();
	if (!token) {
		handleError("expired or nonexistent auth token");
		return;
	}

	const { url, typename, feedbacktype } = btn.dataset;
	if (url === undefined || typename === undefined || feedbacktype === undefined) {
		handleError(
			`at least one of url: ${url}, typename: ${typename}, feedbacktype: ${feedbacktype} is undefined`,
		);
		return;
	}

	const params = new URL("https://www.google.com" + url).searchParams;
	let parentFeedbackType: string;
	let childFeedbackType: string;
	let focusKind = "scratchpad";
	if (typename === "ResponseFeedbackNotification") {
		parentFeedbackType = feedbacktype === "ANSWER" ? "QUESTION" : "COMMENT";
		childFeedbackType = "REPLY";
		focusKind = params.get("qa_expand_type") as string;
	} else if (typename === "ProgramFeedbackNotification") {
		parentFeedbackType = feedbacktype;
		childFeedbackType = feedbacktype === "QUESTION" ? "ANSWER" : "REPLY";
	} else {
		handleError("Invalid notification type");
		return;
	}

	try {
		// Grab parent feedback to get encrypted parent key
		// Why does KA encrypt a public key? Who knows.
		const parentFeedbackResponse = await khanApiFetch("feedbackQuery", token, {
			topicId: +url.split("?")[0].split("/")!.pop()!,
			feedbackType: parentFeedbackType,
			currentSort: 2,
			qaExpandKey: params.get("qa_expand_key") as string,
			focusKind,
		});

		const parentFeedbackJSON = await parentFeedbackResponse.json();
		if (!parentFeedbackJSON.data.feedback) {
			throw new Error("Unsupported feedback type");
		}
		const feedback = parentFeedbackJSON.data.feedback.feedback[0];

		const parentKey =
			feedbacktype === "QUESTION" && params.get("qa_expand_type") === "answer"
				? feedback.answers[0].key
				: feedback.key;

		const childFeedbackResponse = await khanApiFetch("AddFeedbackToDiscussion", token, {
			parentKey,
			textContent: textarea.value,
			feedbackType: childFeedbackType,
			fromVideoAuthor: false,
			shownLowQualityNotice: false,
		});

		if (!childFeedbackResponse.ok) throw new Error("Failed to send message");

		btn.textContent = "Success!";
		window.setTimeout(() => {
			btn.textContent = "Reply";
			textarea.remove();
		}, 5000);
	} catch (err) {
		if (typeof err === "string") {
			handleError(err);
		} else if (err instanceof Error) {
			handleError(err.message);
		}
	}
}
