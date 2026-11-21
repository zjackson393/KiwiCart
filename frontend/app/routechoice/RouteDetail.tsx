import { RouteResult } from "@/app/routechoice/types";
import styles from "@/app/routechoice/routeChoice.module.css";
import Icon from "@/app/components/Icon";
import { CONFIG } from "@/app/routechoice/RouteCard";
import { retailerById } from "@/lib/retailers";
import { isWeightedSoldBy } from "../grocerylist/quantity";
import { useState } from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import 'react-loading-skeleton/dist/skeleton.css'

export default function RouteDetail({ result, allDone }: { result: RouteResult | null; allDone: boolean }) {
    const [expandedStop, setExpandedStop] = useState<number | null>(null);
    const cfg = result ? CONFIG[result.kind] : null;
    return (
        <div className={'px-4'}>
            {allDone && result?.data && cfg && (
                <div>
                    <div className={styles.sheetHandle} />

                    <div className={styles.sheetHeader}>
                        <span className={`${styles.cardIconWrap} ${cfg.accentClass}`}>
                            <Icon name={cfg.icon} size={20} filled />
                        </span>
                        <div>
                            <h3 className={styles.sheetTitle}>{cfg.label} route</h3>
                            <p className={styles.cardTagline}>{cfg.tagline}</p>
                        </div>
                    </div>

                    <ul className={styles.stopList}>
                        {result.data.stops.map((stop, i) => (
                            <li key={stop.name} className={styles.stopItem}>
                                <div
                                    className={styles.stopRow}
                                    onClick={() => setExpandedStop((prev) => (prev === i ? null : i))}
                                >
                                    <span className={styles.stopIndex}>{i + 1}</span>
                                    <div className={styles.stopInfo}>
                                        <span className={styles.stopName}>
                                            <span
                                                className={styles.stopDot}
                                                style={{ backgroundColor: retailerById(stop.retailer).color }}
                                                aria-hidden="true"
                                            />
                                            {stop.name}
                                        </span>
                                        <span className={styles.stopMeta}>
                                            {stop.items.length} item{stop.items.length !== 1 ? "s" : ""}
                                            {" · "}
                                            {stop.items
                                                .reduce((acc, item) => acc + parseFloat(item.price.replace("$", "")) * item.qty, 0)
                                                .toLocaleString("en-NZ", { style: "currency", currency: "NZD" })}
                                        </span>
                                    </div>
                                    <Icon
                                        name="expand_more"
                                        size={18}
                                        className={`${styles.stopChevron} ${expandedStop === i ? styles.stopChevronOpen : ""}`}
                                    />
                                </div>

                                <div className={`grid transition-all duration-300 ease-in-out ${expandedStop === i ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                                    <div className={`overflow-hidden`}>
                                        <ul className={styles.itemList}>
                                            {stop.items.map((item) => (
                                                <li key={item.name} className={styles.itemRow}>
                                                    <span className={styles.itemQtyBadge}>{isWeightedSoldBy(item.sold_by) ? `${item.qty}kg` : `×${item.qty}`}</span>
                                                    <span className={styles.itemName}>{item.name}</span>
                                                    <span className={styles.itemPrice}>{item.price}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            ) || (
                    <SkeletonTheme baseColor="var(--skeleton-base, #E5DDB9)" highlightColor="var(--skeleton-highlight, #F7F5F0)">
                        <div>
                            <h3 className={`${styles.sheetTitle} w-32`}><Skeleton /></h3>
                            <p className={`${styles.cardTagline} w-32`}><Skeleton /></p>
                            <Skeleton count={5} />
                        </div>
                    </SkeletonTheme>
                )}
        </div>
    )
}
