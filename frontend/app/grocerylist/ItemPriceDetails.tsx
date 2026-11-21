import styles from "./Pricetable.module.css";
import {Item} from "@/app/grocerylist/types";
import {retailerById, retailerFor} from "@/lib/retailers";

export default function ItemPriceDetails({item}: {item: Item}) {
    return (
        <table className={styles.priceTable}>
            <thead>
            <tr>
                <th>Store</th>
                <th>Unit</th>
                <th>Price</th>
                <th>Special</th>
                <th>Price updated at</th>
            </tr>
            </thead>
            <tbody>
            {item.prices.map((item) => {
                let unit_string;
                let sale_price;
                let updated_at;
                const retailer = item.retailer ? retailerById(item.retailer) : retailerFor(item.storeName);
                if (!item.price.price_per_uom) {
                    unit_string = "N/A"
                } else {
                    unit_string = `$${item.price.price_per_uom}/${item.price.uom_quantity}${item.price.uom}`;
                }

                if (item.price.sale_price) {
                    sale_price = `$${item.price.sale_price}`
                } else if (item.price.multi_quantity) {
                    sale_price = `${item.price.multi_quantity} for $${item.price.multi_price}`;
                }
                const date = new Date(item.price.updated_at);
                const formattedUTC = new Intl.DateTimeFormat('en-NZ', {
                    minute: '2-digit',
                    hour: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    timeZone: 'UTC'
                }).format(date);
                updated_at = item.price.updated_at;
                return (
                    <tr key={item.storeId}>
                        <td>
                            <span
                                    className={styles.storeDot}
                                    style={{ backgroundColor: retailer.color }}
                                    aria-hidden="true"
                                />
                            {item.storeName}
                        </td>
                        <td className={styles.priceTableMuted}>{unit_string}</td>
                        <td className={styles.priceTableValue}>${item.price.original_price}</td>
                        <td className={styles.priceTableMuted}>{sale_price || "N/A"}</td>
                        <td className={styles.priceTableMuted}>{formattedUTC}</td>
                    </tr>
                )
            })}
            </tbody>
        </table>
    );
}