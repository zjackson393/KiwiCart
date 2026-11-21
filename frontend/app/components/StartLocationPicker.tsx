"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Icon from "@/app/components/Icon";
import {
    setStartLocationCookie,
    geocodeAddress,
    type GeocodeResult,
    type StartLocation,
} from "@/lib/startLocation";
import { fetchStores } from "@/lib/stores";
import { getSelectedStoreIdsClient } from "@/lib/storeSelection";
import type { ApiStore } from "@/lib/stores";
import styles from "./StartLocationPicker.module.css";

export type PickerMode = "location" | "address" | "store";
const ALL_MODES: PickerMode[] = ["location", "address", "store"];
type GeoState = "idle" | "locating" | "denied";

const MIN_QUERY_LEN = 3;
const DEBOUNCE_MS = 350;

const MODE_META: Record<PickerMode, { icon: string; label: string }> = {
    location: { icon: "my_location", label: "Use location" },
    address: { icon: "edit_location_alt", label: "Enter address" },
    store: { icon: "storefront", label: "Use a store" },
};

interface Props {
    /** Fired after a location is saved. The cookie is already written by the time this fires. */
    onSaved: (location: StartLocation) => void;
    /** Which tabs to offer. Defaults to all three (used by the settings page). */
    modes?: PickerMode[];
    initialMode?: PickerMode;
    /**
     * Live list of stores to show under the "Use a store" tab, e.g. the
     * stores currently checked on the store-select page. When provided,
     * this replaces the cookie-based lookup so newly picked stores show
     * up immediately, without needing a saved cookie first.
     */
    storeOptions?: ApiStore[];
}

export default function StartLocationPicker({ onSaved, modes = ALL_MODES, initialMode, storeOptions }: Props) {
    const [mode, setMode] = useState<PickerMode>(initialMode ?? modes[0]);

    // "Use my location"
    const [geoState, setGeoState] = useState<GeoState>("idle");

    // "Enter address"
    const [query, setQuery] = useState("");
    const [searching, setSearching] = useState(false);
    const [addressResults, setAddressResults] = useState<GeocodeResult[] | null>(null);
    const [addressError, setAddressError] = useState<string | null>(null);

    // "Use a store"
    const [myStores, setMyStores] = useState<ApiStore[]>(storeOptions ?? []);

    useEffect(() => {
        // Caller is driving the store list live (e.g. store-select page) —
        // skip the cookie/fetch path entirely and just mirror the prop.
        if (storeOptions) {
            setMyStores(storeOptions);
            return;
        }
        if (mode !== "store") return;
        const ids = getSelectedStoreIdsClient();
        if (ids.length === 0) return;
        fetchStores()
            .then((all) => setMyStores(all.filter((s) => ids.includes(s.id))))
            .catch(() => setMyStores([]));
    }, [mode, storeOptions]);

    // Debounced live address search, same behaviour as the original.
    useEffect(() => {
        if (mode !== "address") return;

        const trimmed = query.trim();
        if (trimmed.length < MIN_QUERY_LEN) {
            setAddressResults(null);
            setAddressError(null);
            setSearching(false);
            return;
        }

        const controller = new AbortController();
        setSearching(true);
        setAddressError(null);

        const t = setTimeout(async () => {
            try {
                const results = await geocodeAddress(trimmed, controller.signal);
                setAddressResults(results);
                if (results.length === 0) setAddressError("No matches found, try a more specific address.");
            } catch (e) {
                if ((e as Error).name !== "AbortError") {
                    setAddressError("Address lookup failed, check your connection and try again.");
                }
            } finally {
                if (!controller.signal.aborted) setSearching(false);
            }
        }, DEBOUNCE_MS);

        return () => {
            clearTimeout(t);
            controller.abort();
        };
    }, [query, mode]);

    const save = (location: StartLocation) => {
        setStartLocationCookie(location);
        onSaved(location);
    };

    const handleLocate = () => {
        if (typeof window === "undefined" || !("geolocation" in navigator)) {
            setGeoState("denied");
            return;
        }
        setGeoState("locating");
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                save({ mode: "browser", lat: pos.coords.latitude, lng: pos.coords.longitude, name: "Your Location" });
            },
            () => setGeoState("denied"),
            { timeout: 5000 }
        );
    };

    return (
        <div className={styles.wrap}>
            <div className={styles.modeRow}>
                {modes.map((m) => (
                    <button
                        key={m}
                        type="button"
                        className={`${styles.modeBtn} ${mode === m ? styles.modeBtnActive : ""}`}
                        onClick={() => setMode(m)}
                    >
                        <Icon name={MODE_META[m].icon} size={16} /> {MODE_META[m].label}
                    </button>
                ))}
            </div>

            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.25}
                onDragEnd={(_, info) => {
                    const currentIndex = modes.indexOf(mode);
                    if (info.offset.x < -60 && currentIndex < modes.length - 1) {
                        setMode(modes[currentIndex + 1]);
                    } else if (info.offset.x > 60 && currentIndex > 0) {
                        setMode(modes[currentIndex - 1]);
                    }
                }}
            >
                <AnimatePresence mode="wait" initial={false}>
                    {mode === "location" && (
                        <motion.div
                            key="location"
                            initial={{ opacity: 0, x: 24 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -24 }}
                            transition={{ duration: 0.16 }}
                            className={styles.panel}
                        >
                            <p className={styles.panelHint}>We&apos;ll ask your browser for your current position.</p>
                            <button type="button" className={styles.primaryBtn} onClick={handleLocate} disabled={geoState === "locating"}>
                                <Icon name="my_location" size={18} />
                                {geoState === "locating" ? "Locating…" : "Use my current location"}
                            </button>
                            {geoState === "denied" && (
                                <p className={styles.errorText}>
                                    <Icon name="location_off" size={14} /> Couldn&apos;t get your location. Try
                                    entering an address instead.
                                </p>
                            )}
                        </motion.div>
                    )}

                    {mode === "address" && (
                        <motion.div
                            key="address"
                            initial={{ opacity: 0, x: 24 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -24 }}
                            transition={{ duration: 0.16 }}
                            className={styles.panel}
                        >
                            <div className={styles.searchRow}>
                                <input
                                    type="text"
                                    placeholder="Street address or suburb"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    className={styles.textInput}
                                    autoComplete="off"
                                />
                            </div>
                            {searching && <p className={styles.panelHint}>Searching…</p>}
                            {addressError && <p className={styles.errorText}>{addressError}</p>}
                            {addressResults && addressResults.length > 0 && (
                                <ul className={styles.resultList}>
                                    {addressResults.map((r, i) => (
                                        <li key={i}>
                                            <button
                                                type="button"
                                                className={styles.resultBtn}
                                                onClick={() => save({ mode: "coords", lat: r.lat, lng: r.lng, name: r.name })}
                                            >
                                                <Icon name="location_on" size={16} />
                                                {r.name}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </motion.div>
                    )}

                    {mode === "store" && (
                        <motion.div
                            key="store"
                            initial={{ opacity: 0, x: 24 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -24 }}
                            transition={{ duration: 0.16 }}
                            className={styles.panel}
                        >
                            {myStores.length > 0 ? (
                                <ul className={`${styles.resultList} ${styles.storeResultList}`}>
                                    {myStores.map((s) => (
                                        <li key={s.id}>
                                            <button
                                                type="button"
                                                className={styles.resultBtn}
                                                onClick={() => save({ mode: "store", storeId: s.id, name: s.name })}
                                            >
                                                <Icon name="storefront" size={16} />
                                                {s.name}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className={styles.panelHint}>
                                    You haven&apos;t picked any stores yet.
                                </p>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}