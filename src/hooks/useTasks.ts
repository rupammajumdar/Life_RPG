/**
 * useTasks — Optimistic mutation for task completion, creation, editing, and deletion.
 *
 * Optimistic UI flow:
 *  1. On mutate: immediately mark task as complete in cache + show +XP particle + sound
 *  2. On success: reconcile cache with authoritative server values + level-up fanfare
 *  3. On offline: keep optimistic state in cache and enqueue in offline outbox
 *  4. On error: rollback task to incomplete + show toast error
 *
 * Idempotency: a UUID v4 is generated CLIENT-SIDE before the request
 * and sent as clientRequestId. The server's unique index guarantees
 * exactly-once processing even if the network retries the request.
 */
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";
import toast from "react-hot-toast";
import {
  CompletionResult,
  DashboardData,
  TaskData,
  CreateTaskRequest,
} from "@/types";
import { DASHBOARD_KEY } from "./useDashboard";
import { sound } from "@/lib/sound";
import {
  enqueueTaskCompletion,
  isDeviceOnline,
  flushOfflineOutbox,
} from "@/lib/offline-outbox";

// ─── useTasks Query (for /tasks page) ─────────────────────────────────────────

export const TASKS_KEY = ["tasks"];

async function fetchAllTasks(): Promise<TaskData[]> {
  const res = await fetch("/api/tasks");
  if (!res.ok) throw new Error("Failed to load tasks");
  const json = await res.json();
  return json.data;
}

export function useTasksList() {
  return useQuery({
    queryKey: TASKS_KEY,
    queryFn: fetchAllTasks,
  });
}

// ─── completeTask with Offline Outbox & Anti-Cheat Idempotency ───────────────

async function completeTask(taskId: string): Promise<CompletionResult> {
  const clientRequestId = uuidv4();

  if (!isDeviceOnline()) {
    enqueueTaskCompletion({
      taskId,
      clientRequestId,
      queuedAt: Date.now(),
    });
    throw Object.assign(new Error("OFFLINE_QUEUED"), {
      isOffline: true,
      clientRequestId,
    });
  }

  try {
    const res = await fetch(`/api/tasks/${taskId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientRequestId }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw Object.assign(
        new Error(err.error ?? "Failed to complete task"),
        { status: res.status }
      );
    }

    const json = await res.json();
    return json.data as CompletionResult;
  } catch (err: unknown) {
    const errorObj = err as { isOffline?: boolean; status?: number; message?: string };
    if (
      errorObj.isOffline ||
      (typeof navigator !== "undefined" && !navigator.onLine)
    ) {
      enqueueTaskCompletion({
        taskId,
        clientRequestId,
        queuedAt: Date.now(),
      });
      throw Object.assign(new Error("OFFLINE_QUEUED"), { isOffline: true });
    }
    throw err;
  }
}

export function useCompleteTask(options?: {
  onLevelUp?: (levelUps: number[]) => void;
  onXpGain?: (xpGained: number, taskId: string) => void;
  onAchievement?: (achievements: CompletionResult["newAchievements"]) => void;
}) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: completeTask,

    // ── Optimistic update ──────────────────────────────────────────────────
    onMutate: async (taskId: string) => {
      // Play 8-bit sound immediately
      sound.playTaskComplete();

      // Cancel in-flight refetches
      await qc.cancelQueries({ queryKey: DASHBOARD_KEY });
      await qc.cancelQueries({ queryKey: TASKS_KEY });

      // Snapshot for rollback
      const dashboardSnapshot = qc.getQueryData<DashboardData>(DASHBOARD_KEY);
      const tasksSnapshot = qc.getQueryData<TaskData[]>(TASKS_KEY);

      // Optimistically mark task complete in dashboard cache
      qc.setQueryData<DashboardData>(DASHBOARD_KEY, (old) => {
        if (!old) return old;
        return {
          ...old,
          todayTasks: old.todayTasks.map((t: TaskData) =>
            t.id === taskId ? { ...t, isCompletedToday: true } : t
          ),
        };
      });

      // Optimistically mark task complete in tasks page cache
      qc.setQueryData<TaskData[]>(TASKS_KEY, (old) => {
        if (!old) return old;
        return old.map((t) =>
          t.id === taskId ? { ...t, isCompletedToday: true } : t
        );
      });

      // Fire particle callback immediately for tactile snappy feel
      options?.onXpGain?.(0, taskId);

      return { dashboardSnapshot, tasksSnapshot };
    },

    // ── Success: reconcile with authoritative server response ──────────────
    onSuccess: (result: CompletionResult, taskId: string) => {
      // Update dashboard cache with real server values
      qc.setQueryData<DashboardData>(DASHBOARD_KEY, (old) => {
        if (!old) return old;
        return {
          ...old,
          user: {
            ...old.user,
            totalXp: result.newTotalXp,
            level: result.newLevel,
            gold: result.newGold,
            xpProgress: result.xpProgress,
            xpNeededForNext: result.xpNeededForNext,
          },
          streak: result.newStreak,
          todayTasks: old.todayTasks.map((t: TaskData) =>
            t.id === taskId ? { ...t, isCompletedToday: true } : t
          ),
        };
      });

      // Trigger level-up animation & sound
      if (result.levelUps.length > 0) {
        sound.playLevelUp();
        options?.onLevelUp?.(result.levelUps);
      }

      // Trigger achievement notifications
      if (result.newAchievements.length > 0) {
        options?.onAchievement?.(result.newAchievements);
        result.newAchievements.forEach((ach) => {
          toast.success(`🏆 Achievement Unlocked: ${ach.title}!`, {
            duration: 5000,
          });
        });
        qc.invalidateQueries({ queryKey: ["achievements"] });
      }

      // Streak milestone
      if (result.milestoneCrossed) {
        toast.success(
          `🔥 ${result.milestoneCrossed}-Day Streak! +${result.milestoneBonus} bonus XP!`,
          { duration: 6000 }
        );
      }

      // Invalidate related caches
      qc.invalidateQueries({ queryKey: ["history"] });
      qc.invalidateQueries({ queryKey: ["shop"] });
      qc.invalidateQueries({ queryKey: TASKS_KEY });
    },

    // ── Error: handle offline or rollback optimistic state ─────────────────
    onError: (
      err: Error & { status?: number; isOffline?: boolean },
      _taskId: string,
      context:
        | {
            dashboardSnapshot?: DashboardData;
            tasksSnapshot?: TaskData[];
          }
        | undefined
    ) => {
      // If offline, do NOT rollback optimistic state! Outbox will sync later.
      if (err.isOffline || err.message === "OFFLINE_QUEUED") {
        toast("Offline: Quest marked complete locally. Will sync when back online! 📡", {
          icon: "💾",
          duration: 5000,
        });
        return;
      }

      // Restore snapshot on true error
      if (context?.dashboardSnapshot) {
        qc.setQueryData(DASHBOARD_KEY, context.dashboardSnapshot);
      }
      if (context?.tasksSnapshot) {
        qc.setQueryData(TASKS_KEY, context.tasksSnapshot);
      }

      // Handle specific errors gracefully
      if (err.status === 409) {
        toast("Already completed — authoritative state verified 😄", {
          icon: "ℹ️",
        });
        return;
      }

      toast.error("Couldn't save — check your connection. Tap to retry.", {
        duration: 6000,
      });
    },
  });
}

// ─── useCreateTask ─────────────────────────────────────────────────────────────

async function createTask(input: CreateTaskRequest): Promise<TaskData> {
  const res = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "Failed to create task");
  }
  const json = await res.json();
  return json.data;
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTask,
    onSuccess: (newTask: TaskData) => {
      sound.playClick();
      // Prepend to dashboard tasks
      qc.setQueryData<DashboardData>(DASHBOARD_KEY, (old) => {
        if (!old) return old;
        return { ...old, todayTasks: [newTask, ...old.todayTasks] };
      });
      // Prepend to tasks list
      qc.setQueryData<TaskData[]>(TASKS_KEY, (old) => {
        if (!old) return [newTask];
        return [newTask, ...old];
      });
      toast.success("Quest added! ⚔️");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

// ─── useUpdateTask ─────────────────────────────────────────────────────────────

interface UpdateTaskInput {
  id: string;
  title?: string;
  description?: string;
  category?: string;
  difficulty?: string;
  recurrence?: string;
}

async function updateTask({ id, ...updates }: UpdateTaskInput): Promise<TaskData> {
  const res = await fetch(`/api/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "Failed to update task");
  }
  const json = await res.json();
  return json.data;
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateTask,
    onSuccess: (updated: TaskData) => {
      sound.playClick();
      qc.setQueryData<DashboardData>(DASHBOARD_KEY, (old) => {
        if (!old) return old;
        return {
          ...old,
          todayTasks: old.todayTasks.map((t) =>
            t.id === updated.id ? { ...t, ...updated } : t
          ),
        };
      });
      qc.setQueryData<TaskData[]>(TASKS_KEY, (old) => {
        if (!old) return old;
        return old.map((t) => (t.id === updated.id ? updated : t));
      });
      toast.success("Quest updated! ✏️");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

// ─── useDeleteTask ─────────────────────────────────────────────────────────────

async function deleteTask(taskId: string): Promise<void> {
  const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to archive task");
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteTask,
    onSuccess: (_: unknown, taskId: string) => {
      sound.playClick();
      qc.setQueryData<DashboardData>(DASHBOARD_KEY, (old) => {
        if (!old) return old;
        return {
          ...old,
          todayTasks: old.todayTasks.filter((t) => t.id !== taskId),
        };
      });
      qc.setQueryData<TaskData[]>(TASKS_KEY, (old) => {
        if (!old) return old;
        return old.filter((t) => t.id !== taskId);
      });
      toast.success("Quest archived. 📦");
    },
    onError: () => toast.error("Failed to archive task"),
  });
}
