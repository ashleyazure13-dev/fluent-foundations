import { cn } from "@/lib/utils";

/**
 * Acquira brand mark — a stylised "A" (two elegant diagonal strokes)
 * with three conversation dots on the crossbar line.
 * Reads cleanly at 16×16 through 512×512.
 */
export function LogoMark({
  className,
  withBackground = true,
}: {
  className?: string;
  withBackground?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      {withBackground ? (
        <rect width="32" height="32" rx="7" className="fill-primary" />
      ) : null}
      <path
        d="M7 25 L16 6 L25 25"
        fill="none"
        stroke={withBackground ? "var(--color-primary-foreground)" : "currentColor"}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="19" r="1.35" className="fill-[color:var(--color-sage)]" />
      <circle cx="16" cy="19" r="1.35" className="fill-[color:var(--color-sage)]" />
      <circle cx="20" cy="19" r="1.35" className="fill-[color:var(--color-sage)]" />
    </svg>
  );
}

export function Logo({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className={cn("h-8 w-8", markClassName)} />
      <span className="font-display text-xl font-semibold tracking-tight">
        Acquira
      </span>
    </span>
  );
}
