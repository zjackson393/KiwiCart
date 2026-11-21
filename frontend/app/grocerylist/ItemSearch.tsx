"use client";

import { useState, useEffect, useMemo, useRef, Fragment, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import GroceryList from "./groceryList";
import ItemCard from "./itemCard";
import type { Item } from "./types";
import { itemCount, roundQty } from "./quantity";
import SearchBar from "./searchBar";
import styles from "./groceryList.module.css";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { saveCart, getCart } from "@/lib/cart";
import { loadLocalCart, saveLocalCart, clearLocalCart } from "@/lib/localCart";
import WorkflowProgress from "@/app/workflow/WorkflowProgress";
import SlideStage from "@/app/workflow/SlideStage";
import Icon from "@/app/components/Icon";
import ItemPriceDetails from "@/app/grocerylist/ItemPriceDetails";
import { API_BASE } from "@/lib/api";

const MIN_SEARCH_LENGTH = 1;
// Rendering every match at once got sluggish on a large catalog, so this
// caps what actually hits the DOM and tells the user there's more to
// narrow down to.
const MAX_RESULTS_SHOWN = 60;
const SEARCH_DEBOUNCE_MS = 220;
const SKELETON_CARD_COUNT = 8;

interface Props {
    storeIds: string[];
    hasStoreSelection?: boolean;
}

interface ApiCatalogItem extends Omit<Item, "image"> {
    image: string | null;
}

export default function ItemSearch({ storeIds, hasStoreSelection = true }: Props) {
    const [catalog, setCatalog] = useState<Item[] | null>(null);
    const [catalogError, setCatalogError] = useState(false);
    const router = useRouter();
    const [items, setItems] = useState<Item[]>([]);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [remoteResults, setRemoteResults] = useState<Item[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [restoredCart, setRestoredCart] = useState(false);
    const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
    const [gridColumns, setGridColumns] = useState(2);
    const hasHydrated = useRef(false);
    const dragControls = useDragControls();

    // Starter suggestions must never hold up navigation or searching.
    useEffect(() => {
        const controller = new AbortController();
        let cancelled = false;
        const timeout = setTimeout(() => controller.abort(), 10_000);
        const loadCatalog = async () => {
            try {
                if (storeIds.length === 0) {
                    setCatalog([]);
                    return;
                }
                const res = await fetch(`${API_BASE}/stores/catalog`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ stores: storeIds }),
                    signal: controller.signal,
                });
                if (!res.ok) throw new Error("Could not load suggestions");
                const data: ApiCatalogItem[] = await res.json();
                if (cancelled) return;
                setCatalog(data.map((item) => ({ ...item, image: item.image ?? "/map-placeholder.png" })));
            } catch {
                if (cancelled) return;
                setCatalogError(true);
                setCatalog([]);
            } finally {
                clearTimeout(timeout);
            }
        };
        void loadCatalog();
        return () => {
            cancelled = true;
            clearTimeout(timeout);
            controller.abort();
        };
    }, [storeIds]);

    // Debounce: typing quickly no longer re-filters/re-sorts the whole
    // catalog on every keystroke, only once input settles for a moment.
    useEffect(() => {
        const id = setTimeout(() => setSearch(searchInput), SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(id);
    }, [searchInput]);

    // Restore whatever was in progress. The server-saved cart (/cart) is
    // the source of truth every other page in this workflow already reads
    // from, so it's checked first, that's what fixes "going back to Shop
    // from Routes empties the list": the cart was always saved server-side
    // correctly, this page just never read it back. The local copy is a
    // second-tier fallback for changes made since the last save (e.g. a
    // crash or a session expiring before the user hit Continue).
    useEffect(() => {
        if (catalog === null) return;
        let cancelled = false;

        (async () => {
            let restored: Item[] = [];
            let fromServer = false;

            try {
                const serverCart = await getCart();
                if (serverCart.items.length > 0) {
                    for (const line of serverCart.items) {
                        const match = catalog.find((c) => c.productId === line.product_id);
                        if (match) restored.push({ ...match, quantity: line.quantity });
                    }
                    fromServer = restored.length > 0;
                }
            } catch {
                // No saved cart yet, or not reachable, fall through to the
                // local copy below.
            }

            if (!fromServer) {
                const saved = loadLocalCart();
                restored = [];
                for (const line of saved) {
                    const match = catalog.find((c) => c.productId === line.productId);
                    if (match) restored.push({ ...match, quantity: line.quantity });
                }
            }

            if (cancelled) return;
            if (restored.length > 0) {
                // Preserve products added while the saved cart was loading.
                setItems((current) => [...current, ...restored.filter((item) => !current.some((added) => added.productId === item.productId))]);
                setRestoredCart(!fromServer);
            }
            hasHydrated.current = true;
        })();

        return () => {
            cancelled = true;
        };
    }, [catalog]);

    // Keep the local copy in sync as the list changes, once the initial
    // restore above has had a chance to run first.
    useEffect(() => {
        if (!hasHydrated.current) return;
        saveLocalCart(items.map((item) => ({ productId: item.productId, quantity: item.quantity })));
    }, [items]);

    const randomItems = useMemo(() => {
        if (!catalog?.length) return [];
        return [...catalog].sort(() => Math.random() - 0.5).slice(0, MAX_RESULTS_SHOWN);
    }, [catalog]);

    useEffect(() => {
        if (search.length < MIN_SEARCH_LENGTH) {
            setRemoteResults([]);
            setIsSearching(false);
            return;
        }

        const controller = new AbortController();

        const fetchSearchResults = async () => {
            setIsSearching(true);
            try {
                const res = await fetch(`${API_BASE}/stores/catalog`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ stores: storeIds, search }),
                    signal: controller.signal,
                });

                if (!res.ok) {
                    setRemoteResults([]);
                    return;
                }

                const matchedCatalog: ApiCatalogItem[] = await res.json();
                setRemoteResults(matchedCatalog.map((item) => ({ ...item, image: item.image ?? "/map-placeholder.png" })));
            } catch (err) {
                if (err instanceof Error && err.name === "AbortError") return;
                setRemoteResults([]);
            } finally {
                if (!controller.signal.aborted) {
                    setIsSearching(false);
                }
            }
        };

        fetchSearchResults();

        return () => controller.abort();
    }, [search, storeIds]);

    const results = useMemo(() => (search.length < MIN_SEARCH_LENGTH ? randomItems : remoteResults), [search, randomItems, remoteResults]);

    const visibleResults = results.slice(0, MAX_RESULTS_SHOWN);
    const expandedItem = expandedProductId ? visibleResults.find((item) => item.productId === expandedProductId) ?? null : null;
    const expandedIndex = expandedProductId ? visibleResults.findIndex((item) => item.productId === expandedProductId) : -1;
    const expandedRowEndIndex =
        expandedIndex < 0 ? -1 : Math.min(visibleResults.length - 1, Math.floor(expandedIndex / gridColumns) * gridColumns + (gridColumns - 1));
    const expandedAnchor =
        expandedIndex < 0 ? null : `${((expandedIndex % gridColumns) + 0.5) * (100 / gridColumns)}%`;

    // Quick lookup so each card can tell whether (and how much of) itself
    // is already sitting in the cart, without every card re-scanning the
    // whole list on every render.
    const cartQuantityByProductId = useMemo(() => {
        const map = new Map<string, number>();
        for (const item of items) map.set(item.productId, item.quantity);
        return map;
    }, [items]);

    const handleAddItem = (item: Item) => {
        setItems((current) => {
            const existing = current.find((c) => c.productId === item.productId);
            if (existing) {
                return current.map((c) => (c.productId === item.productId ? { ...c, quantity: roundQty(c.quantity + item.quantity) } : c));
            }
            return [...current, item];
        });
    };

    // Mirrors handleAddItem, but subtracts instead of adding, dropping the
    // line entirely once its quantity reaches zero (or below, in case the
    // input's ahead of what's left in the cart).
    const handleRemoveItem = (item: Item, removeQuantity: number) => {
        setItems((current) => {
            const existing = current.find((c) => c.productId === item.productId);
            if (!existing) return current;
            const nextQuantity = roundQty(existing.quantity - removeQuantity);
            if (nextQuantity <= 0) {
                return current.filter((c) => c.productId !== item.productId);
            }
            return current.map((c) => (c.productId === item.productId ? { ...c, quantity: nextQuantity } : c));
        });
    };

    // Close drawer on desktop resize
    useEffect(() => {
        const mq = window.matchMedia("(min-width: 641px)");
        const handler = (e: MediaQueryListEvent) => {
            if (e.matches) setDrawerOpen(false);
        };
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);

    // Keep JS in sync with CSS breakpoints for dropdown anchoring in the grid.
    useEffect(() => {
        const updateGridColumns = () => {
            if (window.matchMedia("(min-width: 1200px)").matches) {
                setGridColumns(4);
                return;
            }
            if (window.matchMedia("(min-width: 900px)").matches) {
                setGridColumns(3);
                return;
            }
            setGridColumns(2);
        };

        updateGridColumns();
        window.addEventListener("resize", updateGridColumns);
        return () => window.removeEventListener("resize", updateGridColumns);
    }, []);

    // Prevent body scroll when drawer open
    useEffect(() => {
        document.body.style.overflow = drawerOpen ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [drawerOpen]);

    const totalItems = itemCount(items);

    const handleContinue = async () => {
        setSaving(true);
        setSaveError(null);
        try {
            await saveCart(
                items.map((item) => ({
                    product_id: item.productId,
                    name: item.name,
                    quantity: item.quantity,
                    store_ids: item.prices.map((p) => p.storeId),
                })),
            );
            // Now safely stored server-side via /cart, so the local
            // safety-net copy can go.
            clearLocalCart();
            router.push("/routechoice");
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : "Could not save your list");
            setSaving(false);
        }
    };

    return (
        <div>
            <WorkflowProgress current={1} unlockedUpTo={1} />
            <SlideStage>
                {/* Floating cart button, bottom right on mobile */}
                <button
                    type="button"
                    className={`${styles.cartFab} ${totalItems > 0 ? styles.cartFabRaised : ""}`}
                    onClick={() => setDrawerOpen(true)}
                    aria-label="Open grocery list"
                >
                    <Icon name="shopping_cart" size={24} filled />
                    {totalItems > 0 && <span className={styles.cartBadge}>{totalItems}</span>}
                </button>

                <div className={`${styles.layout} ${totalItems > 0 ? styles.layoutRaised : ""}`}>
                    <div className={`${styles.panel} ${styles.resultsPanel} ${totalItems > 0 ? styles.resultsPanelRaised : ""}`}>
                        {restoredCart && (
                            <div className={styles.storeNudge}>
                                <Icon name="restore" size={18} />
                                <span>Picked up where you left off, your list was restored.</span>
                            </div>
                        )}
                        {!hasStoreSelection && (
                            <div className={styles.storeNudge}>
                                <Icon name="storefront" size={18} />
                                <span>
                                    Showing prices from default stores.{" "}
                                    <button type="button" className={styles.storeNudgeLink} onClick={() => router.push("/storeSelect")}>
                                        Choose your stores
                                    </button>{" "}
                                    for prices near you.
                                </span>
                            </div>
                        )}
                        <SearchBar onSearch={setSearchInput} />
                        <ul className={styles.itemCardGrid}>
                            {(search.length >= MIN_SEARCH_LENGTH ? isSearching : catalog === null) ? (
                                <SkeletonTheme baseColor="var(--skeleton-base, #E5DDB9)" highlightColor="var(--skeleton-highlight, #F7F5F0)">
                                    {Array.from({ length: SKELETON_CARD_COUNT }).map((_, index) => (
                                        <li key={`skeleton-${index}`} className={styles.itemCard}>
                                            <div className={styles.itemCardImage}>
                                                <Skeleton width="100%" height="100%" />
                                            </div>
                                            <div className={styles.itemCardBody}>
                                                <Skeleton height={16} />
                                                <Skeleton height={12} count={2} />
                                            </div>
                                            <div className={styles.itemCardFooter}>
                                                <Skeleton width={38} height={28} />
                                                <Skeleton width="100%" height={30} />
                                            </div>
                                        </li>
                                    ))}
                                </SkeletonTheme>
                            ) : (
                                visibleResults.map((item, index) => (
                                    <Fragment key={item.productId}>
                                        <ItemCard
                                            item={item}
                                            addItem={handleAddItem}
                                            removeItem={handleRemoveItem}
                                            isInCart={(cartQuantityByProductId.get(item.productId) ?? 0) > 0}
                                            isExpanded={expandedProductId === item.productId}
                                            onToggleExpanded={() =>
                                                setExpandedProductId((current) => (current === item.productId ? null : item.productId))
                                            }
                                        />
                                        {index === expandedRowEndIndex && expandedItem && expandedAnchor && (
                                            <li className={styles.itemCardDetailRow} style={{ "--detail-anchor": expandedAnchor } as CSSProperties}>
                                                <div className={styles.itemCardDetailPanel}>
                                                    <ItemPriceDetails item={expandedItem} />
                                                </div>
                                            </li>
                                        )}
                                    </Fragment>
                                ))
                            )}
                        </ul>
                        {!isSearching && results.length > MAX_RESULTS_SHOWN && (
                            <p className={styles.resultsHint}>
                                Showing {MAX_RESULTS_SHOWN} of {results.length} matches, keep typing to narrow it down.
                            </p>
                        )}
                        {!isSearching && results.length === 0 && search.length >= MIN_SEARCH_LENGTH && (
                            <p className={styles.emptyState}>
                                <Icon name="search_off" size={16} /> No matching results
                            </p>
                        )}
                        {catalogError && search.length < MIN_SEARCH_LENGTH && (
                            <p className={styles.resultsHint} role="status">Suggestions could not load. Search for a product to get started.</p>
                        )}
                        {!catalogError && catalog !== null && !isSearching && search.length < MIN_SEARCH_LENGTH && (
                            <p className={styles.resultsHint}>
                                <Icon name="shuffle" size={14} /> Some picks to get you started, search to find something
                                specific
                            </p>
                        )}
                    </div>

                    {/* Persistent list on wide screens, no drawer needed once there's room */}
                    <div className={`${styles.sidePanel} ${totalItems > 0 ? styles.sidePanelRaised : ""}`}>
                        <GroceryList items={items} setItems={setItems} />
                    </div>
                </div>

                {/* Mobile drawer, drag the handle down (or swipe) to dismiss */}
                <AnimatePresence>
                    {drawerOpen && (
                        <>
                            <motion.div
                                className={styles.drawerOverlay}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setDrawerOpen(false)}
                                aria-hidden="true"
                            />
                            <motion.div
                                className={styles.drawer}
                                role="dialog"
                                aria-modal="true"
                                aria-label="Grocery list"
                                initial={{ y: "100%" }}
                                animate={{ y: totalItems > 0 ? -64 : 0 }}
                                exit={{ y: "100%" }}
                                transition={{ type: "spring", stiffness: 380, damping: 38 }}
                                drag="y"
                                dragListener={false}
                                dragControls={dragControls}
                                dragConstraints={{ top: totalItems > 0 ? -64 : 0, bottom: totalItems > 0 ? -64 : 0 }}
                                dragElastic={{ top: 0, bottom: 0.5 }}
                                onDragEnd={(_, info) => {
                                    if (info.offset.y > 120 || info.velocity.y > 600) setDrawerOpen(false);
                                }}
                            >
                                <div
                                    className={styles.drawerHandle}
                                    onPointerDown={(e) => dragControls.start(e)}
                                    style={{ touchAction: "none" }}
                                />
                                <div className={styles.drawerHeader}>
                                    <span className={styles.drawerTitle}>Grocery List</span>
                                    <button
                                        type="button"
                                        className={styles.drawerCloseBtn}
                                        onClick={() => setDrawerOpen(false)}
                                        aria-label="Close grocery list"
                                    >
                                        <Icon name="close" size={16} />
                                    </button>
                                </div>
                                <GroceryList items={items} setItems={setItems} hideTitle />
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Continue bar, hands the cart to the API and advances the slideshow */}
                <div className={`confirmBar ${items.length > 0 ? "confirmBarVisible" : ""}`}>
                    <span className="confirmText">{saveError ? saveError : `${totalItems} item${totalItems !== 1 ? "s" : ""} in your list`}</span>
                    <button type="button" className="confirmBtn" disabled={items.length === 0 || saving} onClick={handleContinue}>
                        {saving ? "Saving…" : "Choose a route"}
                        {!saving && <Icon name="arrow_forward" size={16} />}
                    </button>
                </div>
            </SlideStage>
        </div>
    );
}
