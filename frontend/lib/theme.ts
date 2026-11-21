export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "kiwicart:theme";

export function getThemePreference(): ThemePreference {
    if (typeof window === "undefined") return "system";
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
}

export function setThemePreference(pref: ThemePreference) {
    if (typeof window === "undefined") return;
    if (pref === "system") {
        window.localStorage.removeItem(STORAGE_KEY);
        document.documentElement.removeAttribute("data-theme");
    } else {
        window.localStorage.setItem(STORAGE_KEY, pref);
        document.documentElement.setAttribute("data-theme", pref);
    }
}

/**
 * Inline script source, applied in <head> before the page paints so there's
 * no flash of the wrong theme on load. Kept as a plain string (rather than
 * importing this module) since it runs before any bundle is hydrated.
 */
export const THEME_BOOTSTRAP_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('${STORAGE_KEY}');
    if (stored === 'light' || stored === 'dark') {
      document.documentElement.setAttribute('data-theme', stored);
    }
  } catch (e) {}
})();
`;
