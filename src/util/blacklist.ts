/**
 * Blacklist tracking and analytics requests.
 */
export function blacklist() {
  const proxiedFetch = fetch;
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = input instanceof Request ? input.url : input.toString();
    if (
      url.startsWith("https://www.khanacademy.org/api/internal/_bb/") ||
      url.startsWith("https://www.khanacademy.org/api/internal/_analytics") ||
      url.includes("ingest.sentry.io/api/")
    ) {
      console.log("%c[BLOCKED]", "color:#f00", url);
      return new Response(null);
    }
    return await proxiedFetch(input, init);
  };
}
