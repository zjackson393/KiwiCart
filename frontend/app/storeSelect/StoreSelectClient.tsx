"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import WorkflowProgress from "@/app/workflow/WorkflowProgress";
import SlideStage from "@/app/workflow/SlideStage";
import PageHeader from "@/app/components/PageHeader";
import Icon from "@/app/components/Icon";
import type { ApiStore } from "@/lib/stores";
import { groupStoresByRetailer } from "@/lib/stores";
import { setSelectedStoreIdsCookie, getSelectedStoreIdsClient, clearSelectedStoreIdsCookie } from "@/lib/storeSelection";
import { getRadiusKmClient, setRadiusKmCookie } from "@/lib/searchRadius";
import { getStartLocationClient, clearStartLocationCookie, type StartLocation } from "@/lib/startLocation";
import StartLocationPicker from "@/app/components/StartLocationPicker";
import styles from "./storeSelect.module.css";
import Collapsible from "@/app/storeSelect/Collapsible";
import dynamic from "next/dynamic";
import { theme } from "@/app/mapdisplay/theme";
import { distanceKm } from '@/lib/geo';
import { start } from "repl";

interface Props {
    stores: ApiStore[];
}

const StoreMap = dynamic(() => import("./StoreMap"), { ssr: false });

// "coords" (manual search) and "browser" (device location) carry a real
// lat/lng up front. "store" resolves to a location later via
// resolveStartPoint in useRoutes.ts, using the selected store's address —
// so it counts as valid only while that store is still checked below.
// "auto" is a label-only fallback with nothing to resolve.
function isValidStart(loc: StartLocation | null, selectedStoreIds: string[]): boolean {
    if (!loc) return false;
    if (loc.mode === "coords" || loc.mode === "browser") {
        return loc.lat !== undefined && loc.lng !== undefined;
    }
    if (loc.mode === "store") {
        return !!loc.storeId && selectedStoreIds.includes(loc.storeId);
    }
    return false;
}

function resolveStartCoords(loc: StartLocation | null): { lat: number; lng: number } | null {
    if (!loc) return null;
    if (loc.mode !== "coords" && loc.mode !== "browser") return null;
    if (!loc.lat || !loc.lng) return null;
    return { lat: loc.lat, lng: loc.lng};
    // NOTE: does not consider the start from store option since that's planned for removal in work item #156
}

export default function StoreSelectClient({ stores }: Props) {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState<string[]>(() => getSelectedStoreIdsClient());
    const [selectedOnly, setSelectedOnly] = useState(false);
    const [saving, setSaving] = useState(false);

    // Starting location: required before continuing to item select.
    const [startLocation, setStartLocation] = useState<StartLocation | null>(null);
    const [startLoading, setStartLoading] = useState(true);
    const [editingStart, setEditingStart] = useState(false);
    const [radiusKm, setRadiusKm] = useState(() => getRadiusKmClient());

    // Stores currently checked, in the shape StartLocationPicker's
    // "Use a store" tab needs — kept live so a pick shows up immediately.
    const selectedStores = useMemo(
        () => stores.filter((s) => selected.includes(s.id)),
        [stores, selected]
    );

    // Keep the store-selection cookie committed live as `selected` changes,
    // the same way StartLocationPicker commits on every pick — so anything
    // reading the cookie (e.g. the settings dropdown) reflects it in real
    // time, without waiting for "Continue".
    useEffect(() => {
        if (selected.length > 0) {
            setSelectedStoreIdsCookie(selected);
        } else {
            clearSelectedStoreIdsCookie();
        }
    }, [selected]);

    useEffect(() => {
        setRadiusKmCookie(radiusKm);
    }, [radiusKm]);

    useEffect(() => {
        let cancelled = false;
        getStartLocationClient()
            .then((loc) => {
                if (cancelled) return;
                setStartLocation(loc);
                setEditingStart(!isValidStart(loc, getSelectedStoreIdsClient()));
            })
            .finally(() => {
                if (!cancelled) setStartLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const hasValidStart = isValidStart(startLocation, selected);
    const startCoords = useMemo(
        () => resolveStartCoords(startLocation),
        [startLocation]
    );

    const isWithinRadius = (store: ApiStore): boolean => {
        if (!startCoords || store.latitude == null || store.longitude == null) return true;
        return distanceKm(startCoords, { lat: store.latitude, lng: store.longitude}) <= radiusKm;
    }

    // If the store backing the saved start location gets unchecked, it's
    // no longer resolvable — clear it and drop back into picker mode.
    useEffect(() => {
        if (startLocation?.mode === "store" && (!startLocation.storeId || !selected.includes(startLocation.storeId))) {
            setStartLocation(null);
            setEditingStart(true);
            clearStartLocationCookie();
        }
    }, [selected, startLocation]);

    const groups = useMemo(() => {
        const q = query.trim().toLowerCase();
        let filtered = q ? stores.filter((s) => s.name.toLowerCase().includes(q)) : stores;
        if (selectedOnly) filtered = filtered.filter((s) => selected.includes(s.id));
        const grouped = groupStoresByRetailer(filtered);
        if (!startCoords) return grouped;
        return grouped.map((group) => ({
            ...group,
            stores: [...group.stores].sort(
                (a, b) => Number(isWithinRadius(b)) - Number(isWithinRadius(a))
            ),
        }));
    }, [stores, query, selectedOnly, selected, startCoords, radiusKm]);

    const toggleStore = (id: string) => {
        setSelected((current) => {
            const next = current.includes(id)
                ? current.filter((s) => s !== id)
                : [...current, id];
            if (next.length === 0) setSelectedOnly(false);
            return next;
        });
    };

    const clearSelected = () => {
        setSelectedOnly(false)
        setSelected([]);
    };

    const canContinue = hasValidStart && selected.length > 0;

    const handleContinue = () => {
        if (!canContinue) return;
        setSaving(true);
        router.push("/grocerylist");
    };

    const RADIUS_MIN = 1;
    const RADIUS_MAX = 20;
    const radiusFillPercent = ((radiusKm - RADIUS_MIN) / (RADIUS_MAX - RADIUS_MIN)) * 100;
    return (
        <div>
            <WorkflowProgress current={0} unlockedUpTo={0} />
            <SlideStage>
                <PageHeader
                    icon="storefront"
                    title="Choose your stores"
                    subtitle="Pick as many branches as you like. We'll compare prices and plan routes across whichever ones you choose."
                />

                <div className={styles.mapSection}>
                    <div style={{ height: "320px", width: "100%", marginBottom: "16px" }}>
                        <StoreMap
                            stores={stores}
                            selectedIds={selected}
                            onToggle={toggleStore}
                            startCoords={startCoords}
                            radiusKm={radiusKm}
                        />
                    </div>

                    <div
                        className={styles.radiusRow}
                        style={
                            {
                                "--radius-track-fill": theme.colours.kcGreenMid,
                                "--radius-track-bg": theme.colours.kcCreamMedium,
                                "--radius-thumb-bg": theme.colours.kcCreamLight,
                                "--radius-thumb-border": theme.colours.kcGreenMid,
                                "--radius-fill-percent": `${radiusFillPercent}%`,
                            } as React.CSSProperties
                        }
                    >
                        <label htmlFor="radius-slider" className={styles.radiusLabel}>
                            Search radius: {radiusKm} km
                        </label>
                        <input
                            id="radius-slider"
                            type="range"
                            min={RADIUS_MIN}
                            max={RADIUS_MAX}
                            step={0.1}
                            value={radiusKm}
                            disabled={!hasValidStart}
                            onChange={(e) => setRadiusKm(Number(e.target.value))}
                            className={styles.radiusSlider}
                        />
                    </div>
                </div>

                {!startLoading && (
                    <div className={styles.startSection}>
                        <h2 className={styles.startHeading}>Starting location</h2>
                        {hasValidStart && !editingStart ? (
                            <div className={styles.startSummary}>
                                <span className={styles.startSummaryText}>
                                    <Icon name="location_on" size={16} />
                                    {startLocation?.name}
                                </span>
                                <button type="button" className={styles.changeBtn} onClick={() => setEditingStart(true)}>
                                    Change
                                </button>
                            </div>
                        ) : (
                            <div className={styles.startCard}>
                                <StartLocationPicker
                                    storeOptions={selectedStores}
                                    onSaved={(loc) => {
                                        setStartLocation(loc);
                                        setEditingStart(false);
                                    }}
                                />
                            </div>
                        )}
                    </div>
                )}

                <div className={styles.wrap}>
                    <div className={styles.searchWrap}>
                        <Icon name="search" size={18} className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Search stores by name"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>

                    {selected.length > 0 && (
                        <div className={styles.selectionActions}>
                            <button
                                type="button"
                                className={styles.changeBtn}
                                onClick={() => setSelectedOnly((v) => !v)}
                            >
                                {selectedOnly ? "Show all" : "Selected only"}
                            </button>
                            <button type="button" className={styles.changeBtn} onClick={clearSelected}>
                                Remove stores
                            </button>
                        </div>
                    )}

                    {groups.map((group) => {
                        return (
                            <Collapsible key={group.retailer} group={group}>
                                <ul className={styles.storeList}>
                                    {group.stores.map((store) => {
                                        const isSelected = selected.includes(store.id);
                                        const inRadius = isWithinRadius(store);
                                        return (
                                            <li key={store.id}>
                                                <button
                                                    type="button"
                                                    className={`${styles.storeCard} ${isSelected ? styles.storeCardSelected : inRadius ? "" : styles.storeCardOutOfRadius}`}
                                                    onClick={() => toggleStore(store.id)}
                                                    aria-pressed={isSelected}
                                                >
                                                    <span className={styles.storeName}>{store.name}</span>
                                                    <span className={styles.checkCircle} aria-hidden="true">
                                                        {isSelected && <Icon name="check" size={14} filled />}
                                                    </span>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </Collapsible>
                        );
                    })}

                    {groups.length === 0 && (
                        <p className={styles.emptyState}>
                            <Icon name="search_off" size={16} /> No stores match that search
                        </p>
                    )}
                </div>

                <div className="confirmBar confirmBarVisible">
                    <span className="confirmText">
                        {!hasValidStart
                            ? "Set a starting location to continue"
                            : selected.length === 0
                                ? "Pick at least one store to continue"
                                : `${selected.length} store${selected.length === 1 ? "" : "s"} selected`}
                    </span>
                    <button type="button" className="confirmBtn" onClick={handleContinue} disabled={saving || !canContinue}>
                        Continue
                        <Icon name="arrow_forward" size={16} />
                    </button>
                </div>
            </SlideStage>
        </div>
    );
}
