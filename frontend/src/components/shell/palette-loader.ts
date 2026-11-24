import { useEffect } from "react";

/**
 * The command palette (and cmdk) is a separate chunk, loaded the first time it opens. Calling this
 * early (hover or focus on the search button) makes that first open instant; the browser fetches
 * the chunk only once.
 */
export const loadCommandPalette = () => import("./command-palette");

/** Ctrl/⌘ K toggles the palette from anywhere in the shell. Lives outside the lazy chunk. */
export function usePaletteShortcut(toggle: () => void) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey) {
        event.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle]);
}
