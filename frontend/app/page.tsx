import {ProtectedRoute} from "@/auth/ProtectedRoute";
import SignInCookies from "@/app/signIn/sign-in-cookies";
import {Suspense} from "react";
import Link from "next/link";
import SlideStage from "@/app/workflow/SlideStage";
import Icon from "@/app/components/Icon";

export default function Home() {
  return (
      <ProtectedRoute>
          <Suspense>
              <SignInCookies /> {/* Redirects if redirectTo is present, as API auto redirects here */}
          </Suspense>

          <div className="flex flex-col bg-page-bg text-ink">

              <main className="flex flex-1 items-center justify-center px-4 py-64 sm:px-6 lg:px-8">
                  <SlideStage>
                      <section className="mx-auto max-w-lg text-center">
                          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-kcGreenMid">
                              Welcome back
                          </p>
                          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                              Let&apos;s plan your shop
                          </h1>
                          <p className="mt-4 text-sm leading-6 text-ink-muted sm:text-base">
                              Pick your stores, build your grocery list, compare cheapest, quickest, and hybrid
                              routes, then follow a turn-by-turn trip. Five quick steps, start to finish.
                          </p>

                          <Link
                              href="/storeSelect"
                              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-kcGreenDark px-6 py-3 text-sm font-semibold text-kcCreamLight shadow-[0_10px_30px_rgba(32,58,20,0.25)] transition hover:bg-kcGreenMid sm:w-auto"
                          >
                              Start shopping <Icon name="arrow_forward" size={16} />
                          </Link>
                      </section>
                  </SlideStage>
              </main>
          </div>
      </ProtectedRoute>
  )
}
