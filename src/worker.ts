type AssetFetcher = {
  fetch(input: Request | string | URL): Promise<Response>;
};

type Env = {
  ASSETS: AssetFetcher;
};

const CANONICAL_HOST = "sloppypaste.com";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.hostname === `www.${CANONICAL_HOST}`) {
      url.hostname = CANONICAL_HOST;
      return Response.redirect(url.toString(), 301);
    }

    let response = await env.ASSETS.fetch(request);

    if (response.status === 404 && shouldServeIndex(url.pathname)) {
      const indexUrl = new URL("/index.html", url.origin);
      response = await env.ASSETS.fetch(new Request(indexUrl, request));
    }

    return withHeaders(response);
  },
};

function shouldServeIndex(pathname: string) {
  const tail = pathname.split("/").pop() ?? "";
  return !tail.includes(".");
}

function withHeaders(response: Response) {
  const headers = new Headers(response.headers);
  const contentType = headers.get("content-type") ?? "";

  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' data:; style-src 'self'; base-uri 'self'; form-action 'none'; object-src 'none'; frame-ancestors 'none'; upgrade-insecure-requests",
  );

  if (contentType.includes("text/html")) {
    headers.set("Cache-Control", "public, max-age=0, must-revalidate");
  }

  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  });
}
