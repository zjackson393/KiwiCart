"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Icon from "./Icon";
import { useAuth } from "@/auth/useAuth";
import type { ApiStore } from "@/lib/stores";
import { getSelectedStoreIdsClient } from "@/lib/storeSelection";
import { getStartLocationClient, type StartLocation } from "@/lib/startLocation";
import { LOYALTY_PROGRAMS, retailerBrand } from "@/lib/retailers";
import { getLinkedRetailers, setRetailerLinked } from "@/lib/loyalty";
import { getThemePreference, setThemePreference, type ThemePreference } from "@/lib/theme";
import { getBreadcrumbPreferenceClient, setBreadcrumbPreferenceClient } from "@/lib/newsletter";
import styles from "./settingsPanel.module.css";

interface Props {
    stores: ApiStore[];
    onNavigate?: () => void;
}

const STORE_PREVIEW_LIMIT = 3;

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: string }[] = [
    { value: "light", label: "Light", icon: "light_mode" },
    { value: "dark", label: "Dark", icon: "dark_mode" },
    { value: "system", label: "System", icon: "settings_suggest" },
];

export default function SettingsPanelContent({ stores, onNavigate }: Props) {
    const { user, guest } = useAuth();
    const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
    const [startLocation, setStartLocation] = useState<StartLocation | null>(null);
    const [linked, setLinked] = useState<Record<string, boolean>>({});
    const [theme, setTheme] = useState<ThemePreference>("system");
    const [breadcrumbEnabled, setBreadcrumbEnabled] = useState(false);
    const [breadcrumbBusy, setBreadcrumbBusy] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            setSelectedStoreIds(getSelectedStoreIdsClient());
            setStartLocation(await getStartLocationClient());
            setLinked(getLinkedRetailers());
            setTheme(getThemePreference());
            if (user && !guest) setBreadcrumbEnabled(await getBreadcrumbPreferenceClient());
        };
        fetchSettings();
    }, [guest, user]);

    const selectedStores = stores.filter((s) => selectedStoreIds.includes(s.id));

    const getInitials = (name: string) =>
        name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

    const handleThemeChange = (pref: ThemePreference) => {
        setTheme(pref);
        setThemePreference(pref);
    };

    const handleToggleLoyalty = (retailerId: string) => {
        const next = !linked[retailerId];
        setRetailerLinked(retailerId, next);
        setLinked(getLinkedRetailers());
    };

    const handleToggleBreadcrumb = async () => {
        const next = !breadcrumbEnabled;
        setBreadcrumbEnabled(next); // optimistic
        setBreadcrumbBusy(true);
        const ok = await setBreadcrumbPreferenceClient(next);
        if (!ok) setBreadcrumbEnabled(!next); // revert on failure
        setBreadcrumbBusy(false);
    };

    return (
        <div className={styles.content}>
            {/* Account */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>
                    <Icon name="account_circle" size={17} /> Account
                </h2>
                {user ? (
                    <div>
                        {guest ? (
                            <div className={styles.accountRow}>
                                <div className={styles.avatar}>{getInitials(user.name)}</div>
                                <div>
                                    <div className={styles.accountName}>{user.name}</div>
                                    <div className={styles.accountEmail}>
                                        Want to save your lists and preferences?
                                        <a className={`underline`} href={"/signIn"}>
                                            Sign In
                                        </a>
                                    </div>
                                    <div className={styles.accountEmail}>Don't worry, we'll save your current list</div>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.accountRow}>
                                <div className={styles.avatar}>{getInitials(user.name)}</div>
                                <div>
                                    <div className={styles.accountName}>{user.name}</div>
                                    <div className={styles.accountEmail}>{user.email}</div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <p className={styles.mutedText}>Not signed in.</p>
                )}
            </section>

            {/* Appearance */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>
                    <Icon name="palette" size={17} /> Appearance
                </h2>
                <div className={styles.themeRow}>
                    {THEME_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            className={`${styles.themeBtn} ${theme === opt.value ? styles.themeBtnActive : ""}`}
                            onClick={() => handleThemeChange(opt.value)}
                            aria-pressed={theme === opt.value}
                        >
                            <Icon name={opt.icon} size={16} />
                            {opt.label}
                        </button>
                    ))}
                </div>
            </section>

            {/* Locations (stores + starting location) */}
            <section className={styles.section}>
                <div className={styles.sectionHeaderRow}>
                    <h2 className={styles.sectionTitle}>
                        <Icon name="location_on" size={17} /> Locations
                    </h2>
                    <Link href="/storeSelect" className={styles.changeLink} onClick={onNavigate}>
                        Change
                    </Link>
                </div>

                <div className={styles.locationsGroup}>
                    <div className={styles.locationsLabel}>
                        <Icon name="my_location" size={14} /> Starting location
                    </div>
                    {startLocation ? (
                        <p className={styles.mutedText}>
                            {startLocation.mode === "coords" || startLocation.mode === "browser" ? (
                                <>
                                    Routes start from <strong>{startLocation.name}</strong>.
                                </>
                            ) : startLocation.mode === "store" ? (
                                <>
                                    Routes start from <strong>{startLocation.name}</strong>.
                                </>
                            ) : (
                                <>Set to let routing pick a default point.</>
                            )}
                        </p>
                    ) : (
                        <p className={styles.mutedText}>
                            Not set. We&apos;ll try your browser location first, and fall back to a default point if that isn&apos;t
                            available.
                        </p>
                    )}
                </div>

                <div className={styles.locationsGroup}>
                    <div className={styles.locationsLabel}>
                        <Icon name="storefront" size={14} /> Your stores
                    </div>
                    {selectedStores.length > 0 ? (
                        <>
                            <ul className={styles.storeList}>
                                {selectedStores.slice(0, STORE_PREVIEW_LIMIT).map((s) => (
                                    <li key={s.id} className={styles.storeRow}>
                                        <span className={styles.storeName}>{s.name}</span>
                                        <span className={styles.storeRetailer}>{s.retailer}</span>
                                    </li>
                                ))}
                            </ul>
                            {selectedStores.length > STORE_PREVIEW_LIMIT && (
                                <p className={styles.storeOverflowText}>
                                    +{selectedStores.length - STORE_PREVIEW_LIMIT} more store
                                    {selectedStores.length - STORE_PREVIEW_LIMIT === 1 ? "" : "s"} selected
                                </p>
                            )}
                        </>
                    ) : (
                        <p className={styles.mutedText}>No stores picked yet, prices are shown from default stores.</p>
                    )}
                </div>
            </section>

            {/* Loyalty programmes */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>
                    <Icon name="loyalty" size={17} /> Loyalty programmes
                </h2>
                <p className={styles.mutedText}>Mark which loyalty programmes you carry. This is saved on this device only.</p>

                <ul className={styles.loyaltyList}>
                    {LOYALTY_PROGRAMS.map((program) => {
                        const brand = retailerBrand(program.retailerId);
                        const isLinked = !!linked[program.retailerId];
                        return (
                            <li key={program.retailerId} className={styles.loyaltyRow}>
                                <span className={styles.storeDot} style={{ backgroundColor: brand?.color ?? "#75512F" }} aria-hidden="true" />
                                <div className={styles.loyaltyInfo}>
                                    <div className={styles.loyaltyProgram}>{program.programName}</div>
                                    <div className={styles.loyaltyOperator}>{brand?.label ?? program.operator}</div>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={isLinked}
                                    className={`${styles.toggle} ${isLinked ? styles.toggleOn : ""}`}
                                    onClick={() => handleToggleLoyalty(program.retailerId)}
                                >
                                    <span className={styles.toggleKnob} />
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </section>
            {user && !guest && (
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        <Icon name="mail" size={17} /> Email Preferences
                    </h2>
                    <div className={styles.loyaltyRow}>
                        <div className={styles.loyaltyInfo}>
                            <div className={styles.loyaltyProgram}>Weekly Breadcrumb</div>
                            <div className={styles.loyaltyOperator}>Get our weekly newsletter!</div>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={breadcrumbEnabled}
                            disabled={breadcrumbBusy}
                            className={`${styles.toggle} ${breadcrumbEnabled ? styles.toggleOn : ""}`}
                            onClick={handleToggleBreadcrumb}
                        >
                            <span className={styles.toggleKnob} />
                        </button>
                    </div>
                </section>
            )}
        </div>
    );
}