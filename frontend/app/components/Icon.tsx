import styles from "./icon.module.css";

interface IconProps {
    /** Material Symbols glyph name, e.g. "shopping_cart", "map", "bolt". */
    name: string;
    className?: string;
    /** Font size in px. Defaults to inherited size. */
    size?: number;
    /** Use the filled variant (FILL axis = 1) instead of outlined. */
    filled?: boolean;
    /** Icon stroke weight, 300 to 600 is the useful range here. */
    weight?: 300 | 400 | 500 | 600;
}

export default function Icon({ name, className = "", size, filled = false, weight = 400 }: IconProps) {
    return (
        <span
            className={`material-symbols-rounded ${styles.icon} ${className}`}
            style={{
                fontSize: size,
                fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' ${weight}, 'GRAD' 0, 'opsz' ${size ?? 24}`,
            }}
            aria-hidden="true"
            translate="no"
        >
            {name}
        </span>
    );
}
