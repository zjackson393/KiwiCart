'use client'
import {useState} from 'react'
import type {Route, Stop, Item} from './types'
import type { Route as ApiRoute } from '@/app/routechoice/types'
import styles from './mapdisplay.module.css'
import {theme} from './theme'
import { Arrow} from './icons'
import Icon from '@/app/components/Icon'
import { retailerById } from '@/lib/retailers'
import { isWeightedSoldBy } from '@/app/grocerylist/quantity'

export function toMapRoute(api: ApiRoute): Route {
    return {
        start: api.start,
        legs: api.legs.map((leg) => ({ duration: leg.duration, coords: leg.coords })),
        stops: api.stops.map((stop) => ({
            name: stop.name,
            retailer: stop.retailer,
            address: stop.address,
            lat: stop.lat,
            lng: stop.lng,
            items: stop.items.map((item) => ({
                name: item.name,
                qty: item.qty,
                price: parseFloat(item.price.replace(/[^0-9.]/g, "")) || 0,
                soldBy: item.sold_by,
            })),
        })),
    };
}

function formatDuration(seconds: number): string {
    if (!seconds && seconds !== 0) return "";
    if (seconds < 60) return `${Math.round(seconds)} sec`;
    const totalMinutes = Math.round(seconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return `${minutes} min`;
    if (minutes === 0) return `${hours} hr`;
    return `${hours} hr ${minutes} min`; // Default return
}

// Line total (unit price x qty) in cents, to avoid floating-point drift.
export function lineTotalCents(item: Item): number {
    return Math.round(Math.round(item.price * 100) * item.qty);
}

function formatCents(cents: number): string {
    return (cents / 100).toFixed(2);
}

function StopItems({items, checked, onToggle, isExpanded, onToggleExpand}: {
    items: Item[],
    checked: boolean[],
    onToggle: (itemIndex: number) => void,
    isExpanded: boolean,
    onToggleExpand: () => void
}) {
    if (items.length === 0) return null;

    const totalCost = formatCents(
        items.reduce((total, item) => total + lineTotalCents(item), 0)
    );
    const checkedCount = items.filter((_, i) => checked[i]).length;
    const allChecked = checkedCount === items.length;

    return (
        <div className={styles.stopitems}>
            <button
                type="button"
                className={styles.itemsummary}
                onClick={onToggleExpand}
                aria-expanded={isExpanded}
            >
                <span
                    className={`${styles.chevron} ${isExpanded ? styles.chevronOpen : ""}`}
                    aria-hidden="true"
                >
                    <Icon name="chevron_right" size={18} />
                </span>
                <span className={styles.summarycount}>
                    {items.length} {items.length === 1 ? "item" : "items"}
                </span>
                <span className={styles.summarydivider} aria-hidden="true" />
                <span className={styles.summarytotal}>${totalCost}</span>
                <span
                    className={`${styles.checkedtag} ${allChecked ? styles.checkedtagdone : ""}`}
                >
                    {checkedCount}/{items.length}
                </span>
            </button>
            <div className={`${styles.itemlist} ${isExpanded ? styles.itemsexpanded : ""}`}>
                <ul className={styles.itemlistinner}>
                    {items.map((item, i) => (
                        <li key={i} className={styles.itemrow}>
                            <label className={styles.itemlabel}>
                                <input
                                    type="checkbox"
                                    checked={checked[i] ?? false}
                                    onChange={() => onToggle(i)}
                                />
                                <span className={styles.itemname}>{item.name}</span>
                            </label>
                            <span className={styles.itemqty}>{isWeightedSoldBy(item.soldBy) ? `${item.qty}kg` : `Qty: ${item.qty}`}</span>
                            <span className={styles.itemprice}>${formatCents(lineTotalCents(item))}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

function StopInfo({from, name, time}: {from: string, name: string, time: number}) {
    return (
        <div className={styles.stopinfo}>
            <p className={styles.stopfrom}>From {from}</p>
            <p className={styles.stoptime}><Icon name="schedule" size={14} /> {formatDuration(time)}</p>
            <p className={styles.stopto}>To {name}</p>
        </div>
    );
}

function StopSpine({one, two}: {one: string, two:string}) {
    return (
        <div className={styles.stopspine}>
            <div className={styles.dot} style={{background: one}}></div>
            <Arrow />
            <div className={styles.dot} style={{background: two}}></div>
        </div>
    );
}

function StopBody({name, from, fromRetailer, toRetailer, time}: {name: string, from: string, fromRetailer?: string, toRetailer?: string, time: number}) {
    return (
        <div className={styles.stopbody}>
            <StopSpine
                one={from === "Your Location" ? theme.colours.kcGreenLight : retailerById(fromRetailer).color}
                two={name === "Your Location" ? theme.colours.kcGreenLight : retailerById(toRetailer).color}
            />
            <StopInfo
                name={name}
                from={from}
                time={time}
            />
        </div>
    );
}

function StopCard({name, from, fromRetailer, toRetailer, time, items, checked, onToggleItem}: {
    name: string, from: string, fromRetailer?: string, toRetailer?: string, time: number,
    items: Item[], checked: boolean[], onToggleItem: (itemIndex: number) => void
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showFull, setShowFull] = useState(true);

    function handleToggleExpand() {
        if (isExpanded) {
            setIsExpanded(false);
            setTimeout(() => setShowFull(true), 70);
        } else {
            setShowFull(false);
            setIsExpanded(true);
        }
    }

    return (
        <div className={styles.stopcard}>
            {showFull
                ? <StopBody name={name} from={from} fromRetailer={fromRetailer} toRetailer={toRetailer} time={time} />
                : <div className={`${styles.stopbody} ${styles.expanded}`}>
                    <div className={styles.dot} style={{background: retailerById(toRetailer).color}}></div>
                    <p className={styles.stopto}>To {name}</p>
                </div>
            }
            <StopItems
                items={items}
                checked={checked}
                onToggle={onToggleItem}
                isExpanded={isExpanded}
                onToggleExpand={handleToggleExpand}
            />
        </div>
    );
}

export function Journey({route, checkedItems, onToggleItem}: {
    route: Route,
    checkedItems: boolean[][],
    onToggleItem: (stopIndex: number, itemIndex: number) => void
}) {
    const stops = route.stops;
    return (
        <div className={styles.journey}>
            {
                stops.map(
                    (stop: Stop, index: number) => (
                        <StopCard
                            key={index}
                            name={stop.name}
                            from={index === 0 ? "Your Location" : stops[index - 1].name}
                            fromRetailer={index === 0 ? undefined : stops[index - 1].retailer}
                            toRetailer={stop.retailer}
                            time={route.legs[index]?.duration}
                            items={stop.items}
                            checked={checkedItems[index] ?? []}
                            onToggleItem={(itemIndex) => onToggleItem(index, itemIndex)}
                        />
                    )
                )
            }
            <StopCard
                name="Your Location"
                from={stops[stops.length - 1].name}
                fromRetailer={stops[stops.length - 1].retailer}
                toRetailer={undefined}
                time={route.legs[route.legs.length - 1]?.duration}
                items={[]}
                checked={[]}
               onToggleItem={() => {}}
            />
        </div>
    );
}
