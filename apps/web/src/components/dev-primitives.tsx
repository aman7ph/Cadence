import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/logo";
import { TaskComposer } from "@/components/task-composer";
import { ReflectionEditor } from "@/components/today-reflection-editor";
import { useTheme } from "@/lib/theme";

/**
 * Dev-only living style guide, mounted at /preview (see App.tsx).
 *
 * It exists because the real pages sit behind auth, so a change to a shared
 * primitive is otherwise unverifiable without signing in. Rendering the actual
 * components — not a copy of their markup — means this cannot drift from them.
 */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap items-center gap-2.5">{children}</div>
    </div>
  );
}

export function DevPrimitives() {
  const { theme, toggle } = useTheme();
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <header className="flex items-center justify-between">
          <h1 className="font-display text-[23px] font-semibold text-foreground">
            Primitives
          </h1>
          <Button variant="outline" size="sm" onClick={toggle}>
            {theme} theme
          </Button>
        </header>

        <Row label="solid — accent CTA">
          <Button size="sm">Add task</Button>
          <Button size="md">Save changes</Button>
          <Button size="lg">Create goal</Button>
          <Button disabled>Disabled</Button>
        </Row>

        <Row label="ghost / danger — plain text">
          <Button variant="ghost">Cancel</Button>
          <Button variant="ghost" size="sm">Close</Button>
          <Button variant="danger">Sign out</Button>
          <Button variant="danger" size="sm">Delete</Button>
        </Row>

        <Row label="outline — tones">
          <Button variant="outline" size="sm">Edit</Button>
          <Button variant="outline" tone="success">✓ Mark complete</Button>
          <Button variant="outline" tone="neutral">○ Abandon</Button>
          <Button variant="outline" tone="danger">Archive</Button>
        </Row>

        <Row label="segment — selected vs not">
          <Button variant="segment" size="sm" selected>Daily</Button>
          <Button variant="segment" size="sm">Weekdays</Button>
          <Button variant="segment" size="sm">Custom</Button>
        </Row>

        <Row label="block — full-width add row">
          <Button variant="block" size="lg">+ New routine</Button>
        </Row>

        <Row label="badge tones">
          <Badge>neutral</Badge>
          <Badge tone="accent">accent</Badge>
          <Badge tone="success">success</Badge>
          <Badge tone="carryover">×8 carried</Badge>
          <Badge tone="danger">danger</Badge>
        </Row>

        <div className="flex flex-col gap-2">
          <Label>input</Label>
          <Input placeholder="Add a task for today" />
        </div>

        <div className="flex flex-col gap-2">
          <Label>card</Label>
          <Card className="p-5">
            <p className="text-[13px] text-[var(--text-secondary)]">
              Card surface, 16px radius, subtle border.
            </p>
          </Card>
        </div>

        <Row label="gyroscope mark — static (chrome) vs animated (loader)">
          <Logo size={16} />
          <Logo size={26} />
          <Logo size={48} />
          <Logo size={96} animated />
        </Row>

        <div className="flex flex-col gap-2">
          <Label>composer — click the gear</Label>
          <TaskComposer
            placeholder="Add a task for today"
            onSubmit={async () => {}}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>reflection — type @ to check the mention list</Label>
          <ReflectionEditor
            date="2026-08-15"
            initialText=""
            routines={["Morning run", "Read 10 pages a day", "30 push-ups", "No breakfast", "One GitHub push"].map(
              (name, i) => ({ routineId: `r${i}`, name }),
            )}
            tasks={["Check email for the reply", "Stretch break", "Plan the week", "Call the bank"].map(
              (title, i) => ({ taskId: `t${i}`, title, status: "open" as const }),
            )}
            hasExisting={false}
            onSaved={() => {}}
            onCancel={() => {}}
          />
        </div>

        <Row label="radius scale">
          {/* Written out, not interpolated: Tailwind scans source statically,
              so a `rounded-${r}` template would only work by coincidence. */}
          {[
            ["sm", "rounded-sm"],
            ["md", "rounded-md"],
            ["lg", "rounded-lg"],
            ["pill", "rounded-pill"],
          ].map(([name, cls]) => (
            <div key={name} className="flex flex-col items-center gap-1.5">
              <div
                className={`h-14 w-20 border border-[var(--border-default)] bg-[var(--surface-active)] ${cls}`}
              />
              <span className="font-mono text-[10px] text-[var(--text-tertiary)]">
                {name}
              </span>
            </div>
          ))}
        </Row>
      </div>
    </div>
  );
}
