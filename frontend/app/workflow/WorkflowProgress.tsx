"use client";

import Link from "next/link";
import { WORKFLOW_STEPS } from "./steps";
import styles from "./WorkflowProgress.module.css";
import Icon from "@/app/components/Icon";

interface Props {
    /** Index (0-based) of the step currently on screen. */
    current: number;
    /** Highest index the user is allowed to jump back to. Defaults to `current`. */
    unlockedUpTo?: number;
}

export default function WorkflowProgress({ current, unlockedUpTo }: Props) {
    const unlocked = unlockedUpTo ?? current;

    return (
        <div className={styles.rail} role="navigation" aria-label="Shopping trip progress">
            {WORKFLOW_STEPS.map((step, i) => {
                const state = i < current ? "done" : i === current ? "active" : "upcoming";
                const clickable = i <= unlocked && i !== current;

                const node = (
                    <div className={`${styles.node} ${styles[state]}`}>
                        <span className={styles.dot}>
                            <Icon name={state === "done" ? "check" : step.icon} size={16} filled={state === "active"} />
                        </span>
                        <span className={styles.label}>{step.label}</span>
                    </div>
                );

                return (
                    <div key={step.id} className={styles.stepWrap}>
                        {clickable ? (
                            <Link href={step.path} className={styles.link} aria-current={i === current ? "step" : undefined}>
                                {node}
                            </Link>
                        ) : (
                            <div className={styles.link} aria-current={i === current ? "step" : undefined}>
                                {node}
                            </div>
                        )}
                        {i < WORKFLOW_STEPS.length - 1 && (
                            <div className={`${styles.connector} ${i < current ? styles.connectorDone : ""}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
