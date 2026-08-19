/**
 * The card every Settings block sits in — heading, optional description, and a
 * stacked body. Its own file because five sections import it and none of them
 * should have to import a sibling section to get it.
 */
export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border border-[var(--border-subtle)] bg-card p-5">
      <div>
        <h2 className="font-display text-[14px] font-semibold text-foreground">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-[11.5px] leading-relaxed text-[var(--text-tertiary)]">
            {description}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}
