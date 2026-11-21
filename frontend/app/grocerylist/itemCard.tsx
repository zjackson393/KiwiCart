import { useState } from "react";
import Image from "next/image";
import type { Item } from "./types";
import { isWeighted, qtyStep } from "./quantity";
import styles from "./groceryList.module.css";
import Icon from "@/app/components/Icon";
import { retailerById, retailerFor } from "@/lib/retailers";

interface Props {
    item: Item;
    addItem: (item: Item) => void;
    removeItem: (item: Item, quantity: number) => void;
    isInCart: boolean;
    isExpanded: boolean;
    onToggleExpanded: () => void;
}

export default function ItemCard({ item, addItem, removeItem, isInCart, isExpanded, onToggleExpanded }: Props) {
    const [quantity, setQuantity] = useState<number>(item.quantity);

    const handleQuantityChange = (value: number) => {
        if (Number.isNaN(value) || value < qtyStep(item)) return;
        setQuantity(value);
    };

    return (
        <li
            className={`${styles.itemCard} ${isExpanded ? styles.itemCardExpanded : ""}`}
            onClick={onToggleExpanded}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onToggleExpanded();
                }
            }}
            aria-expanded={isExpanded}
        >
            <div className={styles.itemCardImage}>
                <Image src={item.image} alt={item.name} width={160} height={160} sizes="160px" loading="lazy" />
            </div>
            <div className={styles.itemCardBody}>
                <span className={styles.itemname}>{item.name}</span>
                <span className={styles.itemCardPrices}>
                    {item.prices.map((p) => {
                        const retailer = p.retailer ? retailerById(p.retailer) : retailerFor(p.storeName);
                        return (
                            <span key={p.storeId} className={styles.itemCardPrice}>
                                <span
                                    className={styles.storeDot}
                                    style={{ backgroundColor: retailer.color }}
                                    aria-hidden="true"
                                />
                                <span className={styles.itemCardStoreName}>{p.storeName}</span>
                                <span className={styles.itemCardPriceValue}>${p.price.original_price}</span>
                            </span>
                        );
                    })}
                </span>
            </div>
            <div className={styles.itemCardFooter}>
                <input
                    id={`cardQuantity-${item.name}`}
                    type="number"
                    min={qtyStep(item)}
                    step={qtyStep(item)}
                    value={quantity}
                    onChange={(e) => handleQuantityChange(e.target.valueAsNumber)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    className={styles.itemCardQtyInput}
                />
                {isWeighted(item) && <span>kg</span>}
                {isInCart ? (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            removeItem(item, quantity);
                        }}
                        onKeyDown={(e) => e.stopPropagation()}
                        className={styles.itemCardRemoveBtn}
                    >
                        <Icon name="remove" size={16} />
                        Remove
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            addItem({ ...item, quantity });
                        }}
                        onKeyDown={(e) => e.stopPropagation()}
                        className={styles.itemCardAddBtn}
                    >
                        <Icon name="add" size={16} />
                        Add
                    </button>
                )}
            </div>
        </li>
    );
}
