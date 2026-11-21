"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Icon from "./Icon";
import SettingsPanelContent from "./SettingsPanelContent";
import { API_BASE } from "@/lib/api";
import type { ApiStore } from "@/lib/stores";
import styles from "./settingsOverlay.module.css";

interface Props {
    open: boolean;
    onClose: () => void;
    /** Full-screen centered mode, used when this is reached directly via /settings. */
    standalone?: boolean;
}

function PanelBody({ stores, onClose }: { stores: ApiStore[]; onClose: () => void }) {
    return (
        <>
            <div className={styles.panelHeader}>
                <span className={styles.panelTitle}>
                    <Icon name="settings" size={18} /> Settings
                </span>
                <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close settings">
                    <Icon name="close" size={16} />
                </button>
            </div>
            <div className={styles.panelBody}>
                <SettingsPanelContent stores={stores} onNavigate={onClose} />
            </div>
        </>
    );
}

export default function SettingsOverlay({ open, onClose, standalone = false }: Props) {
    const [stores, setStores] = useState<ApiStore[]>([]);
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        fetch(`${API_BASE}/stores`)
            .then((res) => (res.ok ? res.json() : []))
            .then(setStores)
            .catch(() => setStores([]));
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [open, onClose]);

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        className={`${styles.backdrop} ${standalone ? styles.backdropSolid : ""}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={onClose}
                    />
                    <div className={standalone ? styles.standaloneWrap : undefined}>
                        <motion.div
                            ref={panelRef}
                            className={`${styles.panel} ${standalone ? styles.panelStandalone : styles.panelAnchored}`}
                            initial={standalone ? { opacity: 0, scale: 0.97 } : { opacity: 0, scale: 0.94, y: -8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={standalone ? { opacity: 0, scale: 0.97 } : { opacity: 0, scale: 0.94, y: -8 }}
                            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                            role="dialog"
                            aria-modal="true"
                            aria-label="Settings"
                        >
                            <PanelBody stores={stores} onClose={onClose} />
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
