export interface WorkflowStep {
    id: string;
    label: string;
    path: string;
    icon: string;
}

/**
 * The four slides of the KiwiCart shopping workflow. Shared by every step's
 * page so the progress rail is identical everywhere and step order lives in
 * exactly one place.
 */
export const WORKFLOW_STEPS: WorkflowStep[] = [
    { id: "store", label: "Store", path: "/storeSelect", icon: "storefront" },
    { id: "shop", label: "Shop", path: "/grocerylist", icon: "shopping_cart" },
    { id: "routes", label: "Routes", path: "/routechoice", icon: "map" },
    { id: "trip", label: "Trip", path: "/mapdisplay", icon: "near_me" },
    { id: "done", label: "Done", path: "/complete", icon: "check_circle" },
];
