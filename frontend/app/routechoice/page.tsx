"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRoutes } from "./useRoutes";
import RouteSwipeDeck from "./RouteSwipeDeck";
import type { RouteKind } from "./types";
import { totalCostCents } from "./RouteCard";
import styles from "./routeChoice.module.css";
import WorkflowProgress from "@/app/workflow/WorkflowProgress";
import SlideStage from "@/app/workflow/SlideStage";
import Icon from "@/app/components/Icon";
import { saveSelectedRoute } from "@/lib/cart";
import RouteDetail from "@/app/routechoice/RouteDetail";
import { ProtectedRoute } from "@/auth/ProtectedRoute";

const MULTISTORE_SAVINGS_THRESHOLD_CENTS = 500; // below this, not worth going to multiple places.

const formatSavings = (cents: number) => (Math.max(cents, 0) / 100).toLocaleString("en-NZ", { style: "currency", currency: "NZD" });

export default function RouteChoicePage() {
    const router = useRouter();
    const { results, cartState, usingFallbackStart } = useRoutes();
    const [selected, setSelected] = useState<RouteKind | null>(null);
    const [activeIndex, setActiveIndex] = useState(1);
    const [detailsFor, setDetailsFor] = useState<RouteKind | null>(null);
    const [confirming, setConfirming] = useState(false);
    const [confirmError, setConfirmError] = useState<string | null>(null);
    const [bannerDismissed, setBannerDismissed] = useState(false);

    const allDone = results.every((r) => !r.loading);
    const detailsResult = results.find((r) => r.kind === detailsFor) ?? null;

    const quickestResult = results.find((r) => r.kind === "quickest");
    const cheapestResult = results.find((r) => r.kind === "cheapest");

    const multistoreSavingsCents = allDone && quickestResult?.data && cheapestResult?.data 
                                    ? totalCostCents(quickestResult.data.stops) - totalCostCents(cheapestResult.data.stops) 
                                    : null;

    const multistoreNotWorthIt = multistoreSavingsCents !== null && multistoreSavingsCents < MULTISTORE_SAVINGS_THRESHOLD_CENTS;

    // No grocery list saved yet, send them back to build one first.
    useEffect(() => {
        if (cartState === "empty") {
            router.replace("/grocerylist");
        }
    }, [cartState, router]);

    const handleConfirm = async () => {
        const chosen = results.find((r) => r.kind === selected)?.data;
        if (!chosen) return;
        setConfirming(true);
        setConfirmError(null);
        try {
            await saveSelectedRoute(chosen);
            router.push("/mapdisplay");
        } catch (err) {
            setConfirmError(err instanceof Error ? err.message : "Could not save your route");
            setConfirming(false);
        }
    };

    return (
        <ProtectedRoute>
            <div className={`${styles.page}`}>
                <WorkflowProgress current={2} unlockedUpTo={2} />

                <SlideStage>
                    {/* Sub-header band */}
                    <div className={styles.subHeader}>
                        <div className={styles.subHeaderInner}>
                            <div className={styles.subHeaderText}>
                                <h2 className={styles.pageTitle}>
                                    <Icon name="map" size={19} /> Choose your route
                                </h2>
                                <p className={styles.pageSubtitle}>
                                    Swipe between three routes we&apos;ve calculated for your list.
                                </p>
                            </div>

                            {!allDone && (
                                <div className={styles.headerStatus}>
                                    <span className={styles.spinner} />
                                    <span className={styles.statusText}>Fetching…</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {usingFallbackStart && !bannerDismissed && (
                        <div className={styles.startLocationBanner}>
                            <Icon name="my_location" size={16} />
                            <span>
                                We couldn&apos;t get your location, so this route starts from a default point.{" "}
                                <Link href="/startlocation?return=/routechoice" className={styles.startLocationLink}>
                                    Set your starting location
                                </Link>
                            </span>
                            <button
                                type="button"
                                className={styles.bannerDismiss}
                                onClick={() => setBannerDismissed(true)}
                                aria-label="Dismiss"
                            >
                                <Icon name="close" size={14} />
                            </button>
                        </div>
                    )}

                    {allDone && multistoreNotWorthIt && (
                        <div className={styles.lowSavingsBanner}>
                            <Icon name="info" size={16} />
                            <span>
                                Splitting your shop across stores saves <strong>{formatSavings(multistoreSavingsCents!)}</strong>.
                                Probably not worth the extra stops. The <strong>quickest</strong> route gets you almost the
                                same price with a lot less driving.
                            </span>
                        </div>
                    )}

                    <main className={styles.deckSection}>
                        <RouteSwipeDeck
                            results={results}
                            allDone={allDone}
                            activeIndex={activeIndex}
                            onActiveIndexChange={setActiveIndex}
                            selected={selected}
                            onSelect={setSelected}
                            onOpenDetails={setDetailsFor}
                        />
                    </main>

                    <RouteDetail result={detailsResult} allDone={allDone} />


                    {/* Confirm bar */}
                    <div className={`confirmBar ${selected ? "confirmBarVisible" : ""}`}>
                        <span className="confirmText">
                            {confirmError
                                ? confirmError
                                : selected && `${selected.charAt(0).toUpperCase() + selected.slice(1)} route selected`}
                        </span>
                        <button
                            type="button"
                            className="confirmBtn"
                            disabled={!selected || confirming}
                            onClick={handleConfirm}
                        >
                            {confirming ? "Saving…" : "Let's go"}
                            <Icon name="arrow_forward" size={16} />
                        </button>
                    </div>
                </SlideStage>
            </div>
        </ProtectedRoute>
    );
}
