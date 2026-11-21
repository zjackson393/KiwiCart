"use client";

import styles from "./header.module.css";
import Image from "next/image";
import { useAuth } from "@/auth/useAuth";
import { useRef, useEffect, useState } from "react";
import Icon from "./components/Icon";
import SettingsOverlay from "./components/SettingsOverlay";

export default function Header() {
    const { user, logout } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((word) => word[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <header className={styles.header}>
            <div className={styles.logoContainer}>
                <Image className={styles.logo} src="/kiwicart-logo.svg" alt="KiwiCart logo" width={30} height={30} />
                <h1 className={styles.kiwicart}>KiwiCart</h1>
            </div>

            {user && (
                <div className={styles.profileContainer} ref={dropdownRef}>
                    <button
                        className={styles.profileButton}
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        aria-expanded={isDropdownOpen}
                        aria-label="User profile menu"
                    >
                        <div className={styles.profileCircle}>
                            {getInitials(user.name)}
                        </div>
                    </button>

                    {isDropdownOpen && (
                        <div className={styles.dropdown}>
                            <div className={styles.dropdownHeader}>{user.name}</div>
                            <button
                                type="button"
                                className={styles.dropdownItem}
                                onClick={() => {
                                    setIsDropdownOpen(false);
                                    setSettingsOpen(true);
                                }}
                            >
                                <Icon name="settings" size={18} />
                                Settings
                            </button>
                            <button
                                onClick={() => {
                                    logout();
                                    setIsDropdownOpen(false);
                                }}
                                className={styles.dropdownItem}
                            >
                                <Icon name="logout" size={18} />
                                Log Out
                            </button>
                        </div>
                    )}

                    <SettingsOverlay open={settingsOpen} onClose={() => setSettingsOpen(false)} />
                </div>
            )}
        </header>
    );
}
