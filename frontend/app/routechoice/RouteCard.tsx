import type { RouteResult } from "./types";
import styles from "./routeChoice.module.css";
import Icon from "@/app/components/Icon";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

interface Props {
    result: RouteResult;
    allDone: boolean;
    selected: boolean;
    onSelect: () => void;
}

export const CONFIG = {
    cheapest: {
        label: "Cheapest",
        icon: "savings",
        tagline: "Lowest total spend",
        accentClass: styles.accentCheapest,
        tag: "Best value",
    },
    quickest: {
        label: "Quickest",
        icon: "bolt",
        tagline: "Least time on the road",
        accentClass: styles.accentQuickest,
        tag: "Fastest trip",
    },
    hybrid: {
        label: "Hybrid",
        icon: "shuffle",
        tagline: "Balanced time & cost",
        accentClass: styles.accentHybrid,
        tag: "Smart balance",
    },
} as const;

export function formatDuration(seconds: number): string {
    const m = Math.round(seconds / 60);
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

export function totalCostCents(stops: NonNullable<RouteResult["data"]>["stops"]): number {
    let cents = 0;
    for (const stop of stops) {
        for (const item of stop.items) {
            cents += Math.round(parseFloat(item.price.replace("$", "")) * 100) * item.qty;
        }
    }
    return cents;
}

export function totalCost(stops: NonNullable<RouteResult["data"]>["stops"]) : string {
    return `$${(totalCostCents(stops) / 100).toFixed(2)}`;
}

/**
 * A single route's compact "front face", shown inside the swipe deck. Full
 * stop-by-stop detail lives in RouteDetailSheet, kept off this card so it
 * stays squished and scannable on a phone-width screen.
 *
 * Content is gated on `allDone` (every route in the deck has settled, not
 * just this one) so all three cards reveal their results together instead
 * of popping in one at a time as each fetch happens to finish.
 */
export default function RouteCard({ result, allDone, selected, onSelect }: Props) {
    const cfg = CONFIG[result.kind];

    return (
        <div className={`${styles.card} ${selected ? styles.cardSelected : ""}`}>
            <div className={`${styles.cardAccentBar} ${cfg.accentClass}`} />

            <span className={styles.cardTag}>{cfg.tag}</span>

            <div className={styles.cardHeader}>
                <span className={`${styles.cardIconWrap} ${cfg.accentClass}`}>
                    {allDone ? <Icon name={cfg.icon} size={20} filled /> : <span className={styles.spinner} />}
                </span>
                <div>
                    <h2 className={styles.cardTitle}>{cfg.label}</h2>
                    <p className={styles.cardTagline}>{allDone ? cfg.tagline : "Calculating route…"}</p>
                </div>
            </div>

            <div className={styles.cardBody}>
                {!allDone && (
                    <SkeletonTheme baseColor="var(--skeleton-base, #E5DDB9)" highlightColor="var(--skeleton-highlight, #F7F5F0)">
                        <div className={styles.statsRow}>
                            <div className={styles.stat}>
                                <span className={styles.statValue}><Skeleton /></span>
                                <span className={styles.statLabel}><Skeleton /></span>
                            </div>
                            <div className={styles.statDivider} />
                            <div className={styles.stat}>
                                <span className={styles.statValue}><Skeleton /></span>
                                <span className={styles.statLabel}><Skeleton /></span>
                            </div>
                            <div className={styles.statDivider} />
                            <div className={styles.stat}>
                                <span className={styles.statValue}><Skeleton /></span>
                                <span className={styles.statLabel}><Skeleton /></span>
                            </div>
                        </div>
                    </SkeletonTheme>
                )}

                {allDone && result.error && (
                    <div className={styles.cardError}>
                        <Icon name="warning" size={16} />
                        <span>{result.error}</span>
                    </div>
                )}

                {allDone && result.data && (
                    <div className={styles.statsRow}>
                        <div className={styles.stat}>
                            <span className={styles.statValue}>
                                {formatDuration(result.data.total_duration)}
                            </span>
                            <span className={styles.statLabel}>drive time</span>
                        </div>
                        <div className={styles.statDivider} />
                        <div className={styles.stat}>
                            <span className={styles.statValue}>
                                {result.data.stops.length}
                            </span>
                            <span className={styles.statLabel}>
                                stop{result.data.stops.length !== 1 ? "s" : ""}
                            </span>
                        </div>
                        <div className={styles.statDivider} />
                        <div className={styles.stat}>
                            <span className={styles.statValue}>
                                {totalCost(result.data.stops)}
                            </span>
                            <span className={styles.statLabel}>est. cost</span>
                        </div>
                    </div>
                )}
            </div>

            {!allDone && (
                <div className={styles.cardActions}>
                    <SkeletonTheme baseColor="var(--skeleton-base, #E5DDB9)" highlightColor="var(--skeleton-highlight, #F7F5F0)">
                        <button type="button" className={styles.selectBtn} disabled aria-hidden="true">
                            <Skeleton />
                        </button>
                    </SkeletonTheme>
                </div>
            )}

            {allDone && result.data && (
                <div className={styles.cardActions}>
                    <button
                        type="button"
                        className={styles.selectBtn}
                        onClick={onSelect}
                        aria-pressed={selected}
                    >
                        {selected ? (
                            <>
                                <Icon name="check" size={16} filled />
                                Selected
                            </>
                        ) : (
                            "Select this route"
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
