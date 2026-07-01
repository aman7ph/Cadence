import type { QueryCtx, MutationCtx } from "../_generated/server";

export async function requireUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthenticated");
  }
  const existing = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
    .unique();
  if (existing) return existing;

  if ("insert" in ctx.db) {
    const userId = await ctx.db.insert("users", {
      tokenIdentifier: identity.subject,
      email: identity.email ?? "",
      name: identity.name ?? identity.givenName ?? undefined,
    });
    const fresh = await ctx.db.get(userId);
    if (!fresh) throw new Error("User insert failed");
    return fresh;
  }

  throw new Error("User not provisioned (read-only context)");
}
