import type { Item } from "./types";

export const isWeightedSoldBy = (soldBy: string) => soldBy === "Unit";
export const isWeighted = (item: Item) => isWeightedSoldBy(item.soldBy);
export const qtyStep = (item: Item) => (isWeighted(item) ? 0.1 : 1);
export const roundQty = (n: number) => Math.round(n * 100) / 100;
export const itemCount = (items: Item[]) =>
    items.reduce((sum, item) => sum + (isWeighted(item) ? 1 : item.quantity), 0);
