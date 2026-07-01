import { cn } from "@/lib/utils";

interface AvatarProps {
  name?: string;
  src?: string | null;
  size?: number;
  className?: string;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Avatar({ name = "", src, size = 36, className }: AvatarProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full overflow-hidden border border-border",
        "bg-[var(--indigo-100)] text-[var(--indigo-700)] dark:bg-[rgba(91,82,232,0.18)] dark:text-[var(--indigo-400)]",
        "font-display font-semibold",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.38),
      }}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        initials(name) || "·"
      )}
    </span>
  );
}
