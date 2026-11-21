import {cookies} from "next/headers";
import ItemSearch from "./ItemSearch";
import {ProtectedRoute} from "@/auth/ProtectedRoute";
import {parseStoreIds, STORE_COOKIE} from "@/lib/storeSelection";

export default async function Page() {
    const cookieStore = await cookies();
    const selected = parseStoreIds(cookieStore.get(STORE_COOKIE)?.value);
    return (
        <ProtectedRoute>
            <ItemSearch storeIds={selected} hasStoreSelection={selected.length > 0} />
        </ProtectedRoute>
    );
}
