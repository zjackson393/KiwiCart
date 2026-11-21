export interface ApiPrice {
    id: string
    updated_at: string
    original_price: number
    sale_price: number | null
    club_price: number | null
    multi_price: number | null
    multi_quantity: number | null
    club_required_multi: boolean
    uom: string
    uom_quantity: number | null
    price_per_uom: number | null
    price_per_uom_sale: number | null
}

export interface StorePrice {
    storeId: string;
    storeName: string;
    retailer: string;
    price: ApiPrice;
}

export interface Item {
    productId: string;
    name: string;
    prices: StorePrice[];
    quantity: number;
    image: string;
    soldBy: string;
}
