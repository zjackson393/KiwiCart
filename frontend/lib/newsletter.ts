import { API_BASE } from "@/lib/api";

export async function getBreadcrumbPreferenceClient(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/auth/breadcrumb-preference`, {
      credentials: "include",
    });
    if (!res.ok) return false;
    const data = await res.json();
    return !!data.enabled;
  } catch {
    return false;
  }
}

export async function setBreadcrumbPreferenceClient(enabled: boolean): Promise<boolean> {
  try {
    const res = await fetch(
        `${API_BASE}/auth/breadcrumb/${enabled ? "subscribe" : "unsubscribe"}`,
        { method: "POST", credentials: "include" },
    );
    return res.ok;
  } catch {
    return false;
  }
}