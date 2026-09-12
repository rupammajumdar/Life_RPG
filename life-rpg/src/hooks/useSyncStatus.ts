"use client";

import { useState, useEffect } from "react";
import { subscribeSyncStatus, flushOfflineOutbox } from "@/lib/offline-outbox";
import { useQueryClient } from "@tanstack/react-query";

export function useSyncStatus() {
  const qc = useQueryClient();
  const [status, setStatus] = useState({
    isOnline: true,
    pendingCount: 0,
    isSyncing: false,
  });

  useEffect(() => {
    const unsubscribe = subscribeSyncStatus((st) => {
      setStatus(st);
    });
    // Try flushing any remaining on mount
    flushOfflineOutbox(qc).catch(() => {});
    return unsubscribe;
  }, [qc]);

  return {
    ...status,
    retrySync: () => flushOfflineOutbox(qc),
  };
}
