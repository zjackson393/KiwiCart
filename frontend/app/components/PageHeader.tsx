"use client";

import { useRouter } from "next/navigation";
import Icon from "./Icon";
import styles from "./pageHeader.module.css";

interface Props {
    icon: string;
    title: string;
    subtitle?: string;
    /** Shows a back/close control. Pass a path to link there, or true to use browser history. */
    back?: string | true;
    backLabel?: string;
}

export default function PageHeader({ icon, title, subtitle, back, backLabel = "Back" }: Props) {
    const router = useRouter();

    const handleBack = () => {
        if (typeof back === "string") {
            router.push(back);
        } else {
            router.back();
        }
    };

    return (
        <div className={styles.wrap}>
            {back && (
                <button type="button" className={styles.backBtn} onClick={handleBack}>
                    <Icon name="arrow_back" size={18} />
                    {backLabel}
                </button>
            )}
            <div className={styles.titleRow}>
                <span className={styles.iconBadge}>
                    <Icon name={icon} size={20} />
                </span>
                <div>
                    <h1 className={styles.title}>{title}</h1>
                    {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
                </div>
            </div>
        </div>
    );
}
