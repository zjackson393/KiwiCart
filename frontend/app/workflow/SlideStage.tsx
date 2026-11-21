"use client";

import styles from "./SlideStage.module.css";

interface Props {
    children: React.ReactNode;
    /** "forward" slides in from the right (advancing), "back" from the left. */
    direction?: "forward" | "back";
}

export default function SlideStage({ children, direction = "forward" }: Props) {
    return (
        <div className={`${styles.stage} ${direction === "back" ? styles.back : ""}`}>
            {children}
        </div>
    );
}
