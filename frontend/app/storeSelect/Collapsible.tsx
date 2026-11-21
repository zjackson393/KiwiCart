import {useState} from "react";
import {RetailerGroup} from "@/lib/stores";
import styles from "./storeSelect.module.css";
import {retailerById} from "@/lib/retailers";
import Icon from "@/app/components/Icon";

export default function Collapsible({group, children}: {group: RetailerGroup; children: React.ReactNode}) {
    const [isOpen, setIsOpen] = useState(false);
    const brand = retailerById(group.retailer);
    const toggleCollapse = () => setIsOpen(!isOpen);
    return (
        <section className={styles.retailerGroup} aria-expanded={isOpen}>
            <button
                type="button"
                className={`${styles.retailerHeading} ${isOpen ? styles.retailerHeadingOpen : ""}`}
                onClick={toggleCollapse}
            >
                <span className={styles.storeDot} style={{ backgroundColor: brand.color }} aria-hidden="true" />
                <h2 className={styles.retailerName}>{group.retailer}</h2>
                <span className={styles.retailerCount}>{group.stores.length}</span>
                <Icon
                    className={`${styles.retailerChevron} ${isOpen ? styles.retailerChevronOpen : ""}`}
                    name={"keyboard_arrow_up"}
                />
            </button>
            <div className={`${styles.retailerPanel} ${isOpen ? styles.retailerPanelOpen : ""}`}>
                <div className={styles.retailerPanelInner}>
                    {children}
                </div>
            </div>
        </section>
    )
}