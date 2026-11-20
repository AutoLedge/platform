import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PanelContext } from "./panel-context";

/** One sheet: its title and note, then the same specimens in light (left) and dark (right). */
export function Sheet({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {note && <p className="text-[13px] text-muted-foreground">{note}</p>}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ThemePanel label="Light · Petrol">{children}</ThemePanel>
        <ThemePanel label="Dark · Graphite" dark>
          {children}
        </ThemePanel>
      </div>
    </section>
  );
}

function ThemePanel({ label, dark, children }: { label: string; dark?: boolean; children: ReactNode }) {
  const [panel, setPanel] = useState<HTMLDivElement | null>(null);
  return (
    <div
      ref={setPanel}
      className={cn(
        "relative flex flex-col gap-4 rounded-lg border border-border bg-background p-6 text-foreground",
        dark && "dark",
      )}
    >
      <p className="text-xs/4 font-medium tracking-[.04em] text-muted-foreground uppercase">{label}</p>
      {/* Render once the panel exists, so open popups can portal into it. */}
      {panel && (
        <PanelContext.Provider value={panel}>
          <div className="flex flex-wrap items-start gap-x-8 gap-y-6">{children}</div>
        </PanelContext.Provider>
      )}
    </div>
  );
}

/** A labelled slot that reserves room for the open popup below its trigger. */
export function Specimen({
  title,
  note,
  height,
  children,
}: {
  title: string;
  note?: string;
  height?: number;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="max-w-[300px]">
        <h3 className="text-[13px] font-medium">{title}</h3>
        {note && <p className="text-xs text-muted-foreground">{note}</p>}
      </div>
      <div style={height ? { minHeight: height } : undefined}>{children}</div>
    </div>
  );
}
