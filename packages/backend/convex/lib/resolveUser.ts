import type { QueryCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";

// Soft-fail variant of requireUser for analytics queries — returns null instead
// of throwing so a sign-out degrades to empty results, not an error toast.
export async function resolveUser(ctx: QueryCtx): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
    .unique();
}
