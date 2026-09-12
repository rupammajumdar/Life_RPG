/**
 * Offline Outbox & Reconnection Sync Engine
 *
 * Implements Section 4.3 & 6.4 of PRD:
 *  - Automatically queues task completions when offline or network fails
 *  - Uses deterministic client_request_id to guarantee idempotency on reconnect
 *  - Auto-flushes when navigator becomes online
 *  - Emits sync state for UI indicators
 */

import { CompletionResult } from "@/types";
import { QueryClient } from "@tanstack/react-query";
import { DASHBOARD_KEY } from "@/hooks/useDashboard";
import toast from "react-hot-toast";

export interface QueuedCompletion {
  taskId: string;
  clientRequestId: string;
  queuedAt: number;
}

const STORAGE_KEY = "life-rpg-offline-outbox";

type SyncListener = (state: { isOnline: boolean; pendingCount: number; isSyncing: boolean }) => void;
const listeners = new Set<SyncListener>();

let isSyncing = false;

function getStoredQueue(): QueuedCompletion[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedCompletion[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // Local storage error non-fatal
  }
}

export function getPendingQueueCount(): number {
  return getStoredQueue().length;
}

export function isDeviceOnline(): boolean {
  if (typeof window === "undefined") return true;
  return typeof navigator.onLine === "boolean" ? navigator.onLine : true;
}

function notifyListeners() {
  const isOnline = isDeviceOnline();
  const pendingCount = getPendingQueueCount();
  listeners.forEach((fn) => fn({ isOnline, pendingCount, isSyncing }));
}

export function subscribeSyncStatus(listener: SyncListener): () => void {
  listeners.add(listener);
  listener({
    isOnline: isDeviceOnline(),
    pendingCount: getPendingQueueCount(),
    isSyncing,
  });
  return () => {
    listeners.delete(listener);
  };
}

export function enqueueTaskCompletion(item: QueuedCompletion) {
  const queue = getStoredQueue();
  // Avoid duplicate enqueue
  if (!queue.some((q) => q.clientRequestId === item.clientRequestId)) {
    queue.push(item);
    saveQueue(queue);
    notifyListeners();
  }
}

export async function flushOfflineOutbox(qc?: QueryClient): Promise<void> {
  if (typeof window === "undefined" || isSyncing) return;
  if (!isDeviceOnline()) return;

  const queue = getStoredQueue();
  if (queue.length === 0) return;

  isSyncing = true;
  notifyListeners();

  const remaining: QueuedCompletion[] = [];
  let syncedCount = 0;

  for (const item of queue) {
    try {
      const res = await fetch(`/api/tasks/${item.taskId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientRequestId: item.clientRequestId }),
      });

      if (res.ok || res.status === 409) {
        // 409 means already processed by server earlier (idempotent), safe to discard
        syncedCount++;
      } else {
        remaining.push(item);
      }
    } catch {
      // Still offline or failed, keep in queue
      remaining.push(item);
    }
  }

  saveQueue(remaining);
  isSyncing = false;
  notifyListeners();

  if (syncedCount > 0) {
    toast.success(`Synced ${syncedCount} offline quest${syncedCount > 1 ? "s" : ""}! ⚔️`, {
      duration: 4000,
    });
    if (qc) {
      qc.invalidateQueries({ queryKey: DASHBOARD_KEY });
      qc.invalidateQueries({ queryKey: ["history"] });
    }
  }
}

// Global window event listeners
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    notifyListeners();
    flushOfflineOutbox().catch(() => {});
  });
  window.addEventListener("offline", () => {
    notifyListeners();
  });
}
