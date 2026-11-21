"use client";

import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/auth/ProtectedRoute";
import SettingsOverlay from "@/app/components/SettingsOverlay";

export default function SettingsPage() {
    const router = useRouter();
    return (
        <ProtectedRoute>
            <SettingsOverlay open onClose={() => router.push("/")} standalone />
        </ProtectedRoute>
    );
}
