import React from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import App from "./App";
import "./index.css";

// Tauri injects __TAURI_INTERNALS__ into the window; absent in a plain browser.
if (!("__TAURI_INTERNALS__" in window)) {
  document.body.classList.add("browser-preview");
}

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;
const convexUrl = import.meta.env.VITE_CONVEX_URL as string;

if (!clerkKey) throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env.local");
if (!convexUrl) throw new Error("Missing VITE_CONVEX_URL in .env.local");

const convex = new ConvexReactClient(convexUrl);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={clerkKey} signInUrl="/" signUpUrl="/" signInFallbackRedirectUrl="/" signUpFallbackRedirectUrl="/">
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <App />
      </ConvexProviderWithClerk>
    </ClerkProvider>
  </React.StrictMode>,
);
