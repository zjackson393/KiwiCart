import type { Metadata } from "next";
import styles from "./signIn.module.css";
import Image from "next/image";
import SignInCookies from "@/app/signIn/sign-in-cookies";
import { Suspense } from "react";
import { API_BASE } from "@/lib/api";
import Icon from "@/app/components/Icon";

export const metadata: Metadata = {
  title: "KiwiCart | Sign in",
  description: "Compare grocery prices across New Zealand supermarkets and plan the cheapest, quickest shopping route.",
};

const FEATURES = [
  {
    icon: "compare_arrows",
    title: "Compare prices, store to store",
    body: "Search once and see what the same trolley costs at New World, PAK'nSAVE, and Woolworths side by side.",
  },
  {
    icon: "route",
    title: "Routes built around you",
    body: "We work out the cheapest run, the quickest run, and a balanced middle ground, so pick whichever fits your afternoon.",
  },
  {
    icon: "storefront",
    title: "Your actual local stores",
    body: "Pick the physical branches near you so prices and drive times are real, not just averages.",
  },
];

const STEPS = [
  { icon: "shopping_cart", label: "Build your list" },
  { icon: "map", label: "Choose a route" },
  { icon: "near_me", label: "Shop the trip" },
];

export default function SignInPage() {
  return (
      <div className={`flex flex-col bg-page-bg text-ink`}>
        <Suspense>
          <SignInCookies />
        </Suspense>

        <main className="flex-1 px-4 py-10 sm:px-6 lg:px-8">
          {/* Hero */}
          <section className="mx-auto flex max-w-lg flex-col items-center text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm">
              <Image className={styles.logo} src="/kiwicart-logo.svg" alt="KiwiCart logo" width={64} height={64} />
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-kcGreenMid">
              Grocery prices, sorted
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Stop overpaying for the same groceries
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-6 text-ink-muted sm:text-base">
              KiwiCart compares prices across New Zealand supermarkets and plans a shopping route around
              whichever ones are actually cheaper, so you find out before you're standing in the aisle. Choose to
              make an account to save your lists and preferences, or continue as a guest to get started.
            </p>

            <a className={`mt-8 w-full ${styles.btnGoogle}`} href={`${API_BASE}/auth/google`}>
              <span className={`${styles.icon} rounded-full bg-white font-bold text-kcGreenDark`}>G</span>
              <span className="leading-5">Continue with Google</span>
            </a>
            <a className={`mt-8 w-full ${styles.btnGoogle}`} href={`${API_BASE}/auth/guest`}>
              <span className="leading-5">Continue as Guest</span>
            </a>

            <p className="mt-5 text-xs leading-5 text-ink-muted">
              By continuing with Google or as a Guest, you agree to KiwiCart&apos;s{" "}
              <a className="underline" href="/terms">Terms of Service</a>{" "}
              and{" "}
              <a className="underline" href="/privacy">Privacy Policy.</a>
              {" "}If you choose to sign in with Google, you&apos;ll be redirected to Google to authenticate.
            </p>
          </section>

          {/* How it works */}
          <section className="mx-auto mt-14 max-w-3xl">
            <div className="flex items-center justify-center gap-3 sm:gap-6">
              {STEPS.map((step, i) => (
                <div key={step.label} className="flex items-center gap-3 sm:gap-6">
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-page-bg dark:shadow-none">
                      <Icon name={step.icon} size={28} filled />
                    </div>
                    <span className="text-xs font-semibold text-ink-muted">{step.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <Icon name="arrow_forward" size={24} className="mb-5 text-ink-muted" />
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Feature highlights */}
          <section className="mx-auto mt-14 grid max-w-3xl gap-4 sm:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 shadow-[0_8px_24px_rgba(32,58,20,0.08)] dark:shadow-none"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-alt text-ink">
                  <Icon name={f.icon} size={20} />
                </div>
                <h3 className="text-sm font-bold text-ink">{f.title}</h3>
                <p className="text-xs leading-5 text-ink-muted">{f.body}</p>
              </div>
            ))}
          </section>
        </main>
      </div>
  );
}
