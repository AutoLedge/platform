// Light / dark / system theme. The choice lives in localStorage as a convenience
// only: if storage is unavailable the app follows the OS setting.
// index.html applies the same logic before first paint, so keep the key in sync.

export type Theme = "light" | "dark" | "system";

const KEY = "autoledge-theme";
const darkQuery = () => window.matchMedia("(prefers-color-scheme: dark)");
let fallback: Theme = "system"; // used only when storage is blocked

export function getTheme(): Theme {
  try {
    const stored = localStorage.getItem(KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return fallback;
  }
}

function applyTheme(theme: Theme = getTheme()) {
  const dark = theme === "dark" || (theme === "system" && darkQuery().matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function setTheme(theme: Theme) {
  fallback = theme;
  try {
    if (theme === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, theme);
  } catch {
    // storage blocked: the choice lasts until reload
  }
  applyTheme(theme);
}

// Call once at startup: applies the theme and keeps it in sync with OS changes
// (when set to system) and with changes made in other tabs.
export function initTheme() {
  applyTheme();
  darkQuery().addEventListener("change", () => applyTheme());
  window.addEventListener("storage", (event) => {
    if (event.key === KEY || event.key === null) applyTheme();
  });
}
