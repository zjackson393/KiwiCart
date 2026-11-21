"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useMotionValue, animate, type PanInfo } from "framer-motion";
import type { RouteKind, RouteResult } from "./types";
import RouteCard from "./RouteCard";
import styles from "./routeChoice.module.css";

interface Props {
    results: RouteResult[];
    allDone: boolean;
    activeIndex: number;
    onActiveIndexChange: (i: number) => void;
    selected: RouteKind | null;
    onSelect: (kind: RouteKind) => void;
    onOpenDetails: (kind: RouteKind) => void;
}

const GAP = 14;
const FALLBACK_VIEWPORT = 320;

/**
 * A one-card-at-a-time swipeable deck. Dragging the track snaps between
 * routes; the active card sits full-size and centered while its neighbours
 * peek from the edges, scaled down, to hint that more routes are a swipe
 * away.
 */
export default function RouteSwipeDeck({
    results,
    allDone,
    activeIndex,
    onActiveIndexChange,
    selected,
    onSelect,
    onOpenDetails,
}: Props) {
    const viewportRef = useRef<HTMLDivElement>(null);
    const [viewportWidth, setViewportWidth] = useState(FALLBACK_VIEWPORT);
    const [cardWidth, setCardWidth] = useState(Math.round(FALLBACK_VIEWPORT * 0.82));
    const x = useMotionValue(0);
    const step = cardWidth + GAP;
    const centerOffset = (viewportWidth - cardWidth) / 2;

    // Measure the viewport (not the ref directly, so render never reads
    // ref.current, only committed state) and re-measure on resize.
    useLayoutEffect(() => {
        function measure() {
            const vw = viewportRef.current?.offsetWidth ?? FALLBACK_VIEWPORT;
            setViewportWidth(vw);
            // Card takes most of the viewport, leaving a sliver of the
            // neighbouring cards visible as a swipe affordance. On wider
            // (desktop) viewports the cap loosens so the card isn't stuck
            // at a phone-friendly size forever.
            const cap = vw > 700 ? 380 : 320;
            setCardWidth(Math.round(Math.min(cap, vw * 0.82)));
        }
        measure();
        window.addEventListener("resize", measure);
        return () => window.removeEventListener("resize", measure);
    }, []);

    useEffect(() => {
        animate(x, centerOffset - activeIndex * step, {
            type: "spring",
            stiffness: 340,
            damping: 34,
        });
    }, [activeIndex, centerOffset, step, x]);

useEffect(() => {
        onOpenDetails(results[activeIndex]?.kind)
    }, [activeIndex])

function handleDragEnd(_: unknown, info: PanInfo) {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    let next = activeIndex;
    if (offset < -50 || velocity < -400) next = Math.min(results.length - 1, activeIndex + 1);
    else if (offset > 50 || velocity > 400) next = Math.max(0, activeIndex - 1);

    if (next !== activeIndex) {
        onActiveIndexChange(next);
    } else {
        // Drag didn't cross the threshold — snap back to the current card's
        // center instead of leaving it wherever the drag ended.
        animate(x, centerOffset - next * step, {
            type: "spring",
            stiffness: 340,
            damping: 34,
        });
    }
}

    return (
        <div className={styles.deckViewport} ref={viewportRef}>
            <motion.div
                className={styles.deckTrack}
                style={{ x, gap: GAP }}
                drag="x"
                dragElastic={0.15}
                dragConstraints={{
                    left: centerOffset - step * (results.length - 1),
                    right: centerOffset,
                }}
                onDragEnd={handleDragEnd}
            >
                {results.map((result, i) => {
                    const isActive = i === activeIndex;

                    return (
                        <motion.div
                            key={result.kind}
                            className={styles.deckSlide}
                            style={{ width: cardWidth, flex: `0 0 ${cardWidth}px` }}
                            animate={{ scale: isActive ? 1 : 0.9, opacity: isActive ? 1 : 0.5 }}
                            transition={{ type: "spring", stiffness: 340, damping: 34 }}
                            onClick={() => !isActive && onActiveIndexChange(i)}
                        >
                            <div className={isActive ? undefined : styles.deckSlideInert}>
                                <RouteCard
                                    result={result}
                                    allDone={allDone}
                                    selected={selected === result.kind}
                                    onSelect={() => onSelect(result.kind)}
                                />
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>

            <div className={styles.dots}>
                {results.map((result, i) => (
                    <button
                        key={result.kind}
                        type="button"
                        className={`${styles.dot} ${i === activeIndex ? styles.dotActive : ""}`}
                        onClick={() => onActiveIndexChange(i)}
                        aria-label={`Show ${result.kind} route`}
                        aria-current={i === activeIndex}
                    />
                ))}
            </div>
        </div>
    );
}
