// Clerk production instances persist the browser session in a __client cookie
// set with SameSite=Lax on the Frontend API domain (clerk.cadence.aman7ph.com).
// This webview runs on http://tauri.localhost — a cross-site origin — so that
// cookie is silently dropped and the session dies on every reload. Clerk's FAPI
// also ignores its cookie-free Authorization-header mechanism ("native mode")
// whenever a request carries an Origin header, and a webview fetch always sends
// one. So we reroute FAPI traffic through Tauri's HTTP plugin (Rust/reqwest,
// which sends no Origin), attach the client JWT ourselves, and persist the JWT
// that FAPI returns in the Authorization response header. clerk-js needs no
// configuration — it just sees a fetch that works.
//
// Verified against the live instance: Authorization-only requests resume the
// exact same client; Origin+Authorization requests return a fresh empty one.

const STORAGE_KEY = "clerk-native-client-jwt";

export function clearClerkClientJwt() {
  localStorage.removeItem(STORAGE_KEY);
}

export function installClerkNativeFetch(publishableKey: string) {
  // pk_live_<base64 of "clerk.cadence.aman7ph.com$"> → FAPI origin
  const encodedHost = publishableKey.split("_")[2];
  if (!encodedHost) return;
  const fapiOrigin = `https://${atob(encodedHost).replace(/\$$/, "")}`;

  const tauriFetchPromise = import("@tauri-apps/plugin-http").then((m) => m.fetch);
  const browserFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const rawUrl =
      typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (!rawUrl.startsWith(fapiOrigin)) return browserFetch(input, init);

    const url = new URL(rawUrl);
    url.searchParams.set("_is_native", "1");

    const headers = new Headers(
      init?.headers ?? (input instanceof Request ? input.headers : undefined),
    );
    const jwt = localStorage.getItem(STORAGE_KEY);
    if (jwt) headers.set("Authorization", jwt);

    const method =
      init?.method ?? (input instanceof Request ? input.method : "GET");
    let body = init?.body ?? null;
    if (body === null && input instanceof Request && method !== "GET" && method !== "HEAD") {
      body = await input.clone().arrayBuffer();
    }

    const tauriFetch = await tauriFetchPromise;
    const res = await tauriFetch(url.href, { method, headers, body });

    const returnedJwt = res.headers.get("authorization");
    if (returnedJwt) localStorage.setItem(STORAGE_KEY, returnedJwt);
    return res;
  };
}
