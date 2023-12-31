import { getLatestMutation, getLatestQuery } from "@bhavjit/khan-api";
import { KhanAPIVariables } from "../@types/extension-types";
import { StringMap } from "../@types/common-types";
import * as QUERIES_JSON from "../json/khan-api-queries.json";

const QUERIES: StringMap = { ...QUERIES_JSON };
delete QUERIES.default;

export async function khanApiFetch(
	queryName: string,
	authToken: string,
	variables: KhanAPIVariables = {},
): Promise<Response> {
	const requestURL = `https://www.khanacademy.org/api/internal/graphql/${queryName}?/fastly/`;
	const query = QUERIES[queryName];

	const requestInit: RequestInit = {
		method: "POST",
		headers: {
			"X-KA-fkey": authToken,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			operationName: queryName,
			query,
			variables,
		}),
		credentials: "same-origin",
	};

	const response = await fetch(requestURL, requestInit);
	if (response.ok) return response;

	if (response.status === 403) {
		console.warn(
			`The query for operation "${queryName}" is no longer in the safelist. Attempting to fetch the latest version from the safelist...`,
		);

		const latestQuery = query.startsWith("mutation")
			? await getLatestMutation(queryName)
			: await getLatestQuery(queryName);

		if (!latestQuery) {
			throw new Error(`The query for operation "${queryName}" was not found in the safelist`);
		}

		requestInit.body = JSON.stringify({
			operationName: queryName,
			query: latestQuery,
			variables,
		});

		const updatedResponse = await fetch(requestURL, requestInit);
		if (updatedResponse.ok) {
			QUERIES[queryName] = latestQuery;
			return updatedResponse;
		}
	}

	throw new Error(`"${queryName}" responded with status of ${response.status}`);
}

export function getAuthToken(): Promise<string> {
	return new Promise<string>((resolve) => {
		chrome.cookies.get(
			{
				url: "https://www.khanacademy.org",
				name: "fkey",
			},
			(cookie) => {
				resolve(cookie?.value ?? "");
			},
		);
	});
}
