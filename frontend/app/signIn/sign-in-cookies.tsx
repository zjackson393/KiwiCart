"use client";

import { useCookies } from "react-cookie";
import {useEffect} from "react";
import {useAuth} from "@/auth/useAuth";
import {useRouter, useSearchParams} from "next/navigation";

export default function SignInCookies() {
    const [cookies, setCookie, removeCookie] = useCookies(["redirectTo"]);
    const {user} = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    useEffect(() => {
        // if redirect is set and the user is signed in redirect them
        if (cookies.redirectTo && user) {
            removeCookie("redirectTo")
            router.push(cookies.redirectTo)
        }
        if (searchParams.has("redirectTo")) {
            const target = searchParams.get("redirectTo");
            // Only accept a genuine same-origin relative path. "//host/path"
            // looks relative but browsers treat it as protocol-relative to
            // an external host, so it must be rejected, not accepted.
            if (target?.startsWith("/") && !target.startsWith("//")) {
                setCookie("redirectTo", target, { path: "/" });
            }
        }
    }, [])
    return null;
}