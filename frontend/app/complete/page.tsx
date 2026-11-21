"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/auth/ProtectedRoute";
import WorkflowProgress from "@/app/workflow/WorkflowProgress";
import SlideStage from "@/app/workflow/SlideStage";
import { clearCart, getTripSummary, type TripSummary } from "@/lib/cart";
import { formatDuration } from "@/app/routechoice/RouteCard";
import Icon from "@/app/components/Icon";

export default function TripCompletePage() {
    const router = useRouter();
    const [summary, setSummary] = useState<TripSummary | null>(null);
    const [resetting, setResetting] = useState(false);

    useEffect(() => {
        getTripSummary()
        .then(setSummary)
        .catch(() => setSummary(null));
    }, []);

    const handleNewTrip = async () => {
        setResetting(true);
        await clearCart();
        router.push("/grocerylist");
    };

    return (
        <ProtectedRoute>
            <div className="flex flex-col bg-page-bg text-ink">
                <WorkflowProgress current={4} unlockedUpTo={4} />

                <main className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
                    <SlideStage>
                        <section className="mx-auto max-w-md rounded-2xl border border-border bg-surface p-8 text-center shadow-[0_12px_40px_rgba(32,58,20,0.12)] dark:shadow-none sm:p-10">
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-kcGreenMid">
                                Trip complete
                            </p>
                            <div className="mt-3 flex justify-center">
                                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-kcGreenDark text-kcCreamLight">
                                    <Icon name="celebration" size={28} filled />
                                </span>
                            </div>
                            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                                Nice one!
                            </h1>

                            {summary ? (
                                <div className="mt-6 flex justify-center gap-6 text-sm">
                                    <div>
                                        <div className="text-xl font-bold">{formatDuration(summary.duration)}</div>
                                        <div className="text-ink-muted">drive time</div>
                                    </div>
                                    <div>
                                        <div className="text-xl font-bold">{summary.stopCount}</div>
                                        <div className="text-ink-muted">stop{summary.stopCount !== 1 ? "s" : ""}</div>
                                    </div>
                                    <div>
                                        <div className="text-xl font-bold">${summary.spent.toFixed(2)}</div>
                                        <div className="text-ink-muted">spent</div>
                                    </div>
                                </div>
                            ) : (
                                <p className="mt-4 text-sm leading-6 text-ink-muted">
                                    Your shopping trip has been marked as done.
                                </p>
                            )}

                            <button
                                type="button"
                                onClick={handleNewTrip}
                                disabled={resetting}
                                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-kcGreenDark px-6 py-3 text-sm font-semibold text-kcCreamLight shadow-[0_10px_30px_rgba(32,58,20,0.25)] transition hover:bg-kcGreenMid disabled:opacity-60 sm:w-auto"
                            >
                                {resetting ? "Starting…" : "Start a new trip"} {!resetting && <Icon name="arrow_forward" size={16} />}
                            </button>
                        </section>
                    </SlideStage>
                </main>
            </div>
        </ProtectedRoute>
    );
}