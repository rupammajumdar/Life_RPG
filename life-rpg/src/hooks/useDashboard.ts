/**
 * useDashboard — React Query hook for the dashboard aggregate endpoint.
 * Single fetch, 30s stale time, automatic background refetch.
 */
import { useQuery } from "@tanstack/react-query";
import { DashboardData } from "@/types";

async function fetchDashboard(): Promise<DashboardData> {
  const res = await fetch("/api/user/dashboard");
  if (!res.ok) {
    const err = await res.json();
    throw Object.assign(new Error(err.error ?? "Failed to load dashboard"), {
      status: res.status,
    });
  }
  const json = await res.json();
  return json.data;
}

export const DASHBOARD_KEY = ["dashboard"] as const;

export function useDashboard() {
  return useQuery({
    queryKey: DASHBOARD_KEY,
    queryFn: fetchDashboard,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}
