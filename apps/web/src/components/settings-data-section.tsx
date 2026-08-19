import { Section } from "./settings-section";

// Travels with its only caller rather than living in settings-section.tsx: no
// other section renders a label/value pair.
function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[13px] font-medium text-[var(--text-secondary)] shrink-0">
        {label}
      </span>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

export function DataSection() {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return (
    <Section
      title="Data"
      description="Information about how your data is stored and processed."
    >
      <FieldRow label="Detected timezone">
        <span className="font-mono text-[13px] text-foreground bg-[var(--bg-sunken)] rounded-sm px-2.5 py-1">
          {timezone}
        </span>
      </FieldRow>
    </Section>
  );
}
