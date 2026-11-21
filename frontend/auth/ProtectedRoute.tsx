"use client";

import { useEffect } from "react";
import {usePathname, useRouter} from "next/navigation";
import { useAuth } from "@/auth/useAuth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { user, loading } = useAuth();
    const pathname = usePathname()

    useEffect(() => {
        if (!loading && !user) {
            router.replace(`/signIn?redirectTo=${pathname}`);
        }
    }, [loading, router, user]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return <div>Redirecting to sign in...</div>;
    }

    return <>{children}</>;
}