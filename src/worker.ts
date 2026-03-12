type AssetFetcher = {
  fetch(input: Request | string | URL): Promise<Response>;
};

type Env = {
  ASSETS: AssetFetcher;
  POSTHOG_KEY: string;
  POSTHOG_HOST: string;
};

const CANONICAL_HOST = "sloppypaste.com";

function shouldServeIndex(pathname: string) {
  const tail = pathname.split("/").pop() ?? "";
  return !tail.includes(".");
}

function withHeaders(response: Response) {
  const headers = new Headers(response.headers);
  const contentType = headers.get("content-type") ?? "";
  headers.delete("content-length");

  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' data:; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline' https://*.i.posthog.com https://*-assets.i.posthog.com; connect-src 'self' https://*.i.posthog.com; base-uri 'self'; form-action 'none'; object-src 'none'; frame-ancestors 'none'; upgrade-insecure-requests",
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

    if (shouldInjectPostHog(response, env)) {
      response = await injectPostHog(response, env);
    }

    return withHeaders(response);
  },
};

function shouldInjectPostHog(response: Response, env: Env) {
  const contentType = response.headers.get("content-type") ?? "";
  return Boolean(env.POSTHOG_KEY) && contentType.includes("text/html");
}

async function injectPostHog(response: Response, env: Env) {
  const html = await response.text();
  const snippet = postHogSnippet(env.POSTHOG_KEY, env.POSTHOG_HOST);
  const body = html.replace("</head>", `${snippet}\n  </head>`);
  const headers = new Headers(response.headers);
  headers.delete("content-length");

  return new Response(body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  });
}

function postHogSnippet(projectKey: string, apiHost: string) {
  const key = JSON.stringify(projectKey);
  const host = JSON.stringify(apiHost);

  return `<script>
!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
posthog.init(${key},{api_host:${host},defaults:"2026-01-30"});
</script>`;
}
