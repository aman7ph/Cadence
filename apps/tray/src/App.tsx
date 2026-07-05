import { useCallback, useEffect, useState } from "react";
import { useAuth, useClerk } from "@clerk/clerk-react";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { TabBar } from "./components/TabBar";
import { RoutinesTab } from "./components/RoutinesTab";
import { TasksTab } from "./components/TasksTab";
import { SignInScreen } from "./components/SignInScreen";
import { EnsureProvisioned } from "./components/EnsureProvisioned";
import { Logo, LoadingShell } from "./components/Shell";
import { SsoCallbackHandler, useDeepLinkCallback } from "./components/SsoCallback";
import { clearClerkClientJwt } from "./lib/clerk-native-fetch";

type Tab = "routines" | "tasks";

const isTauri = "__TAURI_INTERNALS__" in window;

export default function App() {
  const [tab, setTab] = useState<Tab>("routines");
  const isSsoCallback = window.location.pathname === "/sso-callback";
  const [opacity, setOpacity] = useState(() => {
    const saved = localStorage.getItem("overlay-opacity");
    return saved ? Math.max(0.2, Math.min(1, parseFloat(saved))) : 1;
  });

  useEffect(() => {
    document.documentElement.style.setProperty("--overlay-opacity", String(opacity));
    localStorage.setItem("overlay-opacity", String(opacity));
  }, [opacity]);

  const decrease = useCallback(
    () => setOpacity((p) => Math.max(0.2, Math.round((p - 0.1) * 10) / 10)),
    [],
  );
  const increase = useCallback(
    () => setOpacity((p) => Math.min(1, Math.round((p + 0.1) * 10) / 10)),
    [],
  );

  const { signOut } = useClerk();
  const { isSignedIn, isLoaded } = useAuth();

  // Keep tray menu text in sync with Clerk auth state.
  useEffect(() => {
    if (!isTauri || !isLoaded) return;
    import("@tauri-apps/api/core").then(({ invoke }) => {
      invoke("set_signed_in", { signedIn: !!isSignedIn }).catch(() => {});
    });
  }, [isSignedIn, isLoaded]);

  // Listen for sign-out triggered from the tray right-click menu.
  useEffect(() => {
    if (!isTauri) return;
    let unlisten: (() => void) | undefined;
    import("@tauri-apps/api/event").then(({ listen }) => {
      listen("sign-out", () => {
        signOut().then(() => {
          clearClerkClientJwt();
          window.history.replaceState({}, "", "/");
        });
      }).then((fn) => { unlisten = fn; });
    });
    return () => { unlisten?.(); };
  }, [signOut]);

  useDeepLinkCallback();

  if (isSsoCallback) {
    return <SsoCallbackHandler />;
  }

  return (
    <>
      <AuthLoading><LoadingShell /></AuthLoading>

      <Unauthenticated>
        <div className="overlay"><SignInScreen /></div>
      </Unauthenticated>

      <Authenticated>
        <EnsureProvisioned />
        <div className="overlay">
          <div className="header">
            <div className="header-drag" data-tauri-drag-region>
              <Logo />
              <span className="brand">Cadence</span>
            </div>
            <div className="opacity-controls">
              <button className="opacity-btn" onClick={decrease}
                disabled={opacity <= 0.2} title="Decrease opacity">−</button>
              <button className="opacity-btn" onClick={increase}
                disabled={opacity >= 1} title="Increase opacity">+</button>
            </div>
          </div>
          <TabBar active={tab} onChange={setTab} />
          <div className="tab-content">
            {tab === "routines" ? <RoutinesTab /> : <TasksTab />}
          </div>
        </div>
      </Authenticated>
    </>
  );
}
