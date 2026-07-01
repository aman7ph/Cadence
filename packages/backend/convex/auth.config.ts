// Trusts Clerk as the JWT issuer. Reads CLERK_JWT_ISSUER_DOMAIN from the Convex deployment env.
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
