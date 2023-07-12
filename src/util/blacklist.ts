/*
  Blacklist unused fetch requests!
 */
export function blacklist() {
  const proxiedFetch = fetch;
  window.fetch = async function (request: Request, requestInit: RequestInit): Promise<Response> {
    const { url } = request;
    if (url.startsWith("https://www.khanacademy.org/api/internal/_bb/") || url.startsWith("https://www.khanacademy.org/api/internal/_analytics") || url.startsWith("https://o8287.ingest.sentry.io/api/")) {
      console.log("%c[BLOCKED]", "color:#f00", url);
      return new Response(null);
    }
    return proxiedFetch(request, requestInit);
  };
}
