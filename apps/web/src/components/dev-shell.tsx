import { useState } from "react";
import type { AppView } from "@/App";
import { MobileNav } from "@/components/mobile-nav";
import { Sidebar } from "@/components/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";

/**
 * Dev-only shell preview at /preview?shell.
 *
 * The real shell only renders for a signed-in user, so responsive behaviour and
 * the drawer's keyboard/backdrop handling would otherwise be untestable. This
 * mounts the actual Sidebar / MobileNav / ThemeToggle — same components, no
 * auth, no page content.
 */
export function DevShell() {
  const [view, setView] = useState<AppView>("today");
  const [navOpen, setNavOpen] = useState(false);
  const [tab, setTab] = useState<"active" | "archived">("active");
  const [drawer, setDrawer] = useState(false);
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar view={view} onNavigate={setView} />
      <main className="min-w-0 flex-1 overflow-y-auto px-5 py-6 md:px-8 md:py-9">
        <div className="mb-4 flex items-center justify-between gap-3 md:mb-0 md:h-0 md:justify-end">
          <MobileNav
            view={view}
            onNavigate={setView}
            open={navOpen}
            onOpenChange={setNavOpen}
          />
          <ThemeToggle />
        </div>
        <PageHeader
          title="Routines"
          subtitle="Manage your recurring habits — create, edit, and archive."
          tabs={[
            { id: "active", label: "Active", count: 15 },
            { id: "archived", label: "Archived", count: 3 },
          ]}
          active={tab}
          onTabChange={setTab}
        />
        <p className="mt-4 text-[13px] text-[var(--text-secondary)]">
          Shell preview ({view}) — resize below 768px for the burger drawer.
        </p>
        <Button className="mt-4" onClick={() => setDrawer(true)}>
          Open detail drawer
        </Button>
        <Drawer
          open={drawer}
          onOpenChange={setDrawer}
          label="Detail drawer"
          closeLabel="Close"
          className="w-[513px] max-w-full px-7 py-6"
        >
          <h2 className="font-display text-[20px] font-semibold text-foreground">
            Finish Think and Grow Rich
          </h2>
          <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
            Active · Started Jul 14, 2026
          </p>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" tone="success" size="sm">✓ Mark complete</Button>
            <Button variant="outline" size="sm">○ Abandon</Button>
          </div>
        </Drawer>
      </main>
    </div>
  );
}
