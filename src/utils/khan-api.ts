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

/**
 * Stolen code from @bhavjit/khan-api:
 * https://www.npmjs.com/package/@bhavjit/khan-api
 * Tree shaking wasn't working, so putting the functions manually saves
 * about 30kb from output size.
 */
const SAFELIST_URL = "https://cdn.jsdelivr.net/gh/bhavjitChauhan/khan-api@safelist";

/**
 * Gets the latest version of a query from the Khan Academy safelist.
 *
 * @param query The operation name of the query
 *
 * @see {@link https://github.com/bhavjitChauhan/khan-api/tree/safelist/query | Safelisted Queries}
 *
 * @example
 * const GET_FULL_USER_PROFILE_QUERY = await getLatestQuery('getFullUserProfile')
 */
async function getLatestQuery(query: string) {
	const response = await fetch(`${SAFELIST_URL}/query/${query}`);
	if (response.status === 404) return null;
	const text = await response.text();
	return text;
}

/**
 * Gets the latest version of a mutation from the Khan Academy safelist.
 *
 * @param mutation The operation name of the mutation
 *
 * @see {@link https://github.com/bhavjitChauhan/khan-api/tree/safelist/mutation | Safelisted Mutations}
 */
async function getLatestMutation(mutation: string) {
	const response = await fetch(`${SAFELIST_URL}/mutation/${mutation}`);
	if (response.status === 404) return null;
	const text = await response.text();
	return text;
}
