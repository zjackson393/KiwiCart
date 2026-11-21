"use client";

import { useEffect } from "react";

export default function ThemeSync() {
    useEffect(() => {
        const mq = window.matchMedia("(prefers-color-scheme: dark)");

        const apply = () => {
            // Only relevant when the user hasn't explicitly picked a theme.
            if (document.documentElement.hasAttribute("data-theme")) return;
            document.documentElement.classList.toggle("system-dark", mq.matches);
        };

        apply();
        mq.addEventListener("change", apply);
        // Belt-and-braces for the Firefox lag: also re-check on focus,
        // one of the events known to force Firefox to catch up.
        window.addEventListener("focus", apply);

        return () => {
            mq.removeEventListener("change", apply);
            window.removeEventListener("focus", apply);
        };
    }, []);

    return null;
}