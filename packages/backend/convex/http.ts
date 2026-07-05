import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

// Desktop apps (Tauri) can't complete Clerk's OAuth callback themselves in production:
// Clerk ties the callback to a session cookie set on whichever browser started the
// flow, and a desktop app's system-browser window is a different cookie context.
// Instead, the desktop app sends the user to sign in on this real, already-working
// web domain, then this endpoint mints a one-time Clerk sign-in token for the now
// -authenticated user so the desktop app can exchange it for its own session.
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://cadence.aman7ph.com",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

http.route({
  path: "/mint-sign-in-token",
  method: "POST",
  handler: httpAction(async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      return new Response("Server misconfigured: missing CLERK_SECRET_KEY", {
        status: 500,
        headers: corsHeaders,
      });
    }

    const clerkRes = await fetch("https://api.clerk.com/v1/sign_in_tokens", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id: identity.subject, expires_in_seconds: 300 }),
    });

    if (!clerkRes.ok) {
      const text = await clerkRes.text();
      return new Response(text, { status: clerkRes.status, headers: corsHeaders });
    }

    const data = (await clerkRes.json()) as { token: string };
    return new Response(JSON.stringify({ token: data.token }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }),
});

http.route({
  path: "/mint-sign-in-token",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { status: 204, headers: corsHeaders })),
});

export default http;
