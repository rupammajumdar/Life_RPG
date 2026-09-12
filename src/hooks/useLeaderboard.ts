/**
 * useLeaderboard — React Query hook for the real-time global leaderboard.
 * Automatically background-refetches every 5 seconds for live ranking updates.
 */

import { useQuery } from "@tanstack/react-query";
import { LeaderboardResponse, LeaderboardSortOption } from "@/types";

async function fetchLeaderboard(sort: LeaderboardSortOption): Promise<LeaderboardResponse> {
  const res = await fetch(`/api/leaderboard?sort=${sort}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error(err.error ?? "Failed to load leaderboard"), {
      status: res.status,
    });
  }
  const json = await res.json();
  return json.data;
}

export function useLeaderboard(sort: LeaderboardSortOption = "xp") {
  return useQuery({
    queryKey: ["leaderboard", sort] as const,
    queryFn: () => fetchLeaderboard(sort),
    staleTime: 4_000,
    refetchInterval: 5_000, // Real-time automatic polling every 5 seconds
    refetchOnWindowFocus: true,
  });
}
