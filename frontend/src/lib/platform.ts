// Keyboard labels: ⌘ on Apple platforms, Ctrl elsewhere.
export const isApple =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);

/** Label for a Ctrl/⌘ shortcut, e.g. shortcutLabel("B") → "⌘B" or "Ctrl B". */
export function shortcutLabel(key: string) {
  return isApple ? `⌘${key}` : `Ctrl ${key}`;
}
