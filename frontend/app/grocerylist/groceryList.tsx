"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ApiPrice, Item } from "./types";
import { isWeighted, itemCount, qtyStep } from "./quantity";
import styles from "./groceryList.module.css";
import Icon from "@/app/components/Icon";

interface Props {
    items: Item[];
    setItems: Dispatch<SetStateAction<Item[]>>;
    hideTitle?: boolean;
}

const SWIPE_DELETE_THRESHOLD = -72;
const UNDO_TIMEOUT_MS = 5000;

function getMinStoreCost(price: ApiPrice, quantity: number): number {
    const unitPrice = price.sale_price ?? price.original_price;
    const regularCost = unitPrice * quantity;

    const { multi_price, multi_quantity } = price;

    if (
        multi_price == null ||
        !multi_quantity ||
        multi_quantity < 1 ||
        quantity < multi_quantity
    ) {
        return regularCost;
    }

    const bundles = Math.floor(quantity / multi_quantity);
    const remainder = quantity % multi_quantity;
    const multiCost = bundles * multi_price + remainder * unitPrice;

    return Math.min(regularCost, multiCost);
}

function getCostRange(items: Item[]): { min: number; max: number } {
    return items.reduce(
        (range, item) => {
            if (item.prices.length === 0) return range;

            const minCost = Math.min(
                ...item.prices.map((p) => getMinStoreCost(p.price, item.quantity))
            );
            const maxCost =
                Math.max(...item.prices.map((p) => p.price.original_price)) *
                item.quantity;

            return { min: range.min + minCost, max: range.max + maxCost };
        },
        { min: 0, max: 0 }
    );
}

export default function GroceryList({ items, setItems, hideTitle = false }: Props) {
    const [deletedItems, setDeletedItems] = useState<Item[] | null>(null);
    const undoTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const timeoutExpiry = () => {
        if (undoTimeout.current) {
            clearTimeout(undoTimeout.current);
        }

        undoTimeout.current = setTimeout(() => {
            setDeletedItems(null);
            undoTimeout.current = null;
        }, UNDO_TIMEOUT_MS);
    };

    const handleDelete = (productId: string) => {
        const item = items.find((item) => item.productId === productId);

        if (!item) return;

        setDeletedItems([item]);
        setItems((current) => current.filter((item) => item.productId !== productId));
        timeoutExpiry();
    };

    const handleUndo = () => {
        if (!deletedItems || deletedItems.length === 0) return;

        const itemsToRestore = deletedItems;

        setItems((current) => {
            const existingIds = new Set(current.map((item) => item.productId));
            const restored = itemsToRestore.filter((item) => !existingIds.has(item.productId));
            return [...current, ...restored];
        });

        setDeletedItems(null);

        if (undoTimeout.current) {
            clearTimeout(undoTimeout.current);
            undoTimeout.current = null;
        }
    };

    const handleClearAll = () => {
        if (items.length === 0) return;
        setDeletedItems(items);
        setItems([]);
        timeoutExpiry();
    }

    useEffect(() => {
        return () => {
            if (undoTimeout.current) {
                clearTimeout(undoTimeout.current);
            }
        };
    }, []);

    const handleQuantityChange = (productId: string, quantity: number) => {
        const item = items.find((i) => i.productId === productId);
        if (Number.isNaN(quantity) || quantity < (item ? qtyStep(item) : 1)) return;
 

        setItems((current) =>
            current.map((item) =>
                item.productId === productId ? { ...item, quantity } : item
            )
        );
    };

    const totalItems = itemCount(items);
    const { min: minCost, max: maxCost } = getCostRange(items);

    return (
        <div className={styles.groceryListRoot}>
            <div className={styles.panel}>
                {!hideTitle && <span className={styles.listTitle}>Grocery List</span>}

                {items.length === 0 ? (
                    <p className={styles.listEmpty}>No items added yet.</p>
                ) : (
                    <>
                        <div className={styles.itemsummary}>
                            <span className={styles.itemcount}>
                                {totalItems} item{totalItems !== 1 ? "s" : ""}
                            </span>
                            <span className={styles.itemcost}>
                                {items.length} product{items.length !== 1 ? "s" : ""}
                            </span>
                        </div>

                        <div className={styles.itemcostRange}>
                            Estimated total ${minCost.toFixed(2)} — ${maxCost.toFixed(2)}
                        </div>

                        <ul className={styles.itemlist}>
                            <AnimatePresence initial={false}>
                                {items.map((item) => (
                                    <motion.li
                                        key={item.productId}
                                        className={styles.itemrowWrap}
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                        transition={{ duration: 0.18 }}
                                    >
                                        <div className={styles.itemrowDeleteBg} aria-hidden="true">
                                            <Icon name="delete" size={18} />
                                        </div>

                                        <motion.div
                                            className={styles.itemrow}
                                            drag="x"
                                            dragDirectionLock
                                            dragConstraints={{ left: -96, right: 0 }}
                                            dragElastic={{ left: 0.2, right: 0 }}
                                            onDragEnd={(_, info) => {
                                                if (info.offset.x < SWIPE_DELETE_THRESHOLD) {
                                                    handleDelete(item.productId);
                                                }
                                            }}
                                        >
                                            <div className={styles.itemMeta}>
                                                <label className={styles.itemlabel}>
                                                    <input
                                                        type="number"
                                                        min={qtyStep(item)}
                                                        step={qtyStep(item)}
                                                        value={item.quantity}
                                                        onChange={(e) =>
                                                            handleQuantityChange(
                                                                item.productId,
                                                                e.target.valueAsNumber
                                                            )
                                                        }
                                                        onPointerDown={(e) => e.stopPropagation()}
                                                        className={styles.itemQtyInput}
                                                    />
                                                    {isWeighted(item) && <span>kg</span>}

                                                    <span className={styles.itemname}>
                                                        {item.name}
                                                    </span>
                                                </label>

                                                <span className={styles.itemPrices}>
                                                    {item.prices.map((p) => (
                                                        <span key={p.storeId}>
                                                            {p.storeName}: $
                                                            {p.price.original_price.toFixed(2)}
                                                        </span>
                                                    ))}
                                                </span>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleDelete(item.productId)}
                                                className={styles.deleteBtn}
                                                aria-label={`Remove ${item.name}`}
                                            >
                                                <Icon name="close" size={16} />
                                            </button>
                                        </motion.div>
                                    </motion.li>
                                ))}
                            </AnimatePresence>
                        </ul>

                        <button
                            type="button"
                            onClick={handleClearAll}
                            className={styles.clearAllBtn}
                        >
                            <Icon name="delete_sweep" size={16} />
                            Clear all
                        </button>
                    </>
                )}   
                
            </div>

            <AnimatePresence>
                    {deletedItems && deletedItems.length > 0 && (
                        <div className={styles.undoBarWrap}>
                            <motion.div
                                className={styles.undoBar}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 12 }}
                            >
                                <span>
                                    {deletedItems.length === 1 ? (
                                        <>Removed <strong>{deletedItems[0].name}</strong></>
                                    ) : (
                                        <>Removed <strong>{deletedItems.length} items</strong></>
                                    )}
                                    
                                </span>

                                <button type="button" onClick={handleUndo}>
                                    Undo
                                </button>
                            </motion.div>
                        </div>
                        
                    )}
            </AnimatePresence>
        </div>
    );
}
