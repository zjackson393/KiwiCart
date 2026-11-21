import { ProtectedRoute } from "@/auth/ProtectedRoute";
import { fetchStores } from "@/lib/stores";
import StoreSelectClient from "./StoreSelectClient";

export default async function StoreSelectPage() {
    const stores = await fetchStores();
    return (
        <ProtectedRoute>
            <StoreSelectClient stores={stores} />
        </ProtectedRoute>
    );
}
