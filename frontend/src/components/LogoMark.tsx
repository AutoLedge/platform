import { cn } from "@/lib/utils";

/**
 * Placeholder AutoLedge mark (design/artboards/desktop-light.html) until the final logo is chosen.
 * Swap the SVG here; everything else uses this component.
 */
export default function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true" className={cn("size-[18px] shrink-0", className)}>
      <rect width="18" height="18" rx="4" className="fill-primary" />
      <rect x="4" y="5" width="10" height="2" rx="1" className="fill-primary-foreground" />
      <rect x="4" y="11" width="6" height="2" rx="1" className="fill-primary-foreground" />
    </svg>
  );
}
