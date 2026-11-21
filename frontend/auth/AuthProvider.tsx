"use client";

import React, { createContext, useEffect, useState } from "react";
import { AuthContextValue, User } from "@/types/auth";
import {CookiesProvider} from "react-cookie";
import { API_BASE } from "@/lib/api";

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [guest, setGuestMode] = useState(false);

    const refreshUser = async (opts?: { background?: boolean }) => {
        try {
            const res = await fetch(`${API_BASE}/auth/me`, {
                credentials: "include",
            });

            if (res.ok) {
                const resJson: User = await res.json();
                setUser(resJson);
                setGuestMode(resJson.sub === "guest");

            } else if (res.status === 401 || res.status === 403 || !opts?.background) {
                // A background check that fails for another reason (5xx,
                // etc.) leaves the current session alone rather than
                // signing the user out. Only a definitive "not
                // authenticated" response, or the initial check, does that.
                setUser(null);
            }
        } catch {
            if (!opts?.background) {
                setUser(null);
            }
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true)
        try {
            const res = await fetch(`${API_BASE}/auth/logout`, {
                method: 'DELETE',
                credentials: 'include'
            })
            if (res.ok) {
                setUser(null)
            }
        } catch {
        //     if an error occurred refreshUser to handle it
            await refreshUser();
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        // Intentional: check the current auth session once on mount by
        // calling the /auth/me endpoint and syncing the result into state.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void refreshUser();

        // The initial check alone isn't enough: without this, a session
        // that expires mid-task stays looking "signed in" in the UI until
        // some unrelated API call fails with a 401 deep in a workflow,
        // silently losing whatever the user was doing. Re-checking on an
        // interval and when the tab regains focus catches that early
        // instead, while it's still just a sign-in prompt rather than a
        // lost grocery list.
        const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
        const interval = setInterval(() => {
            void refreshUser({ background: true });
        }, REFRESH_INTERVAL_MS);

        const handleVisibility = () => {
            if (document.visibilityState === "visible") {
                void refreshUser({ background: true });
            }
        };
        document.addEventListener("visibilitychange", handleVisibility);
        window.addEventListener("focus", handleVisibility);

        return () => {
            clearInterval(interval);
            document.removeEventListener("visibilitychange", handleVisibility);
            window.removeEventListener("focus", handleVisibility);
        };
    }, []);

    return (
        <CookiesProvider>
            <AuthContext.Provider value={{ user, guest, loading, refreshUser, logout }}>
                {children}
            </AuthContext.Provider>
        </CookiesProvider>

    );
}