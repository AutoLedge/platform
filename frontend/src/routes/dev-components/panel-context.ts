import { createContext, useContext, useState } from "react";

// The themed panel (light or `.dark`) that open specimens portal into, so popups pick up its theme.
export const PanelContext = createContext<HTMLElement | null>(null);

export function usePanel() {
  return useContext(PanelContext) ?? undefined;
}

// Specimens start open and stay open when you click elsewhere on the page (so both themes can be
// compared side by side), but the trigger, Esc and choosing an item still close them.
export function useSpecimenOpen(initial = true) {
  const [open, setOpen] = useState(initial);
  const onOpenChange = (next: boolean, details?: { reason?: string }) => {
    if (!next && (details?.reason === "outside-press" || details?.reason === "focus-out")) return;
    setOpen(next);
  };
  return { open, onOpenChange };
}
