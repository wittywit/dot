"use client"

import { useState, useEffect, useCallback } from "react";

// Google Calendar API helpers
const CALENDAR_API_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

declare global {
  interface Window {
    __dot_gcal_token?: string;
  }
}

function getAccessToken() {
  // This assumes the access token is stored globally by GIS sign-in
  return window.__dot_gcal_token || null;
}

function setAccessToken(token: string) {
  window.__dot_gcal_token = token;
}

// Offline queueing helpers
function getOfflineQueue() {
  try {
    return JSON.parse(localStorage.getItem("dot-offline-queue") || "[]");
  } catch {
    return [];
  }
}
function setOfflineQueue(queue: any[]) {
  localStorage.setItem("dot-offline-queue", JSON.stringify(queue));
}

export function useTasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch events from Google Calendar
  const fetchTasks = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    try {
      const now = new Date();
      const timeMin = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString();
      const res = await fetch(
        `${CALENDAR_API_URL}?singleEvents=true&maxResults=2500&orderBy=startTime&timeMin=${timeMin}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.items) {
        setTasks(
          data.items.map((event: any) => {
            // Map all-day recurring events to 10am
            if (event.recurrence && event.start && event.start.date && !event.start.dateTime) {
              return {
                ...event,
                start: { dateTime: event.start.date + "T10:00:00" },
                end: { dateTime: event.end.date + "T11:00:00" },
                isAllDay: true,
              };
            }
            return { ...event, isAllDay: false };
          })
        );
      }
    } catch (e) {
      // If offline, keep current tasks
    }
    setLoading(false);
  }, []);

  // Add task (create event)
  const addTask = async (taskData: any) => {
    const token = getAccessToken();
    const event = {
      summary: taskData.title,
      description: taskData.description || "",
      start: { dateTime: taskData.dateTime },
      end: { dateTime: taskData.endDateTime || taskData.dateTime },
      recurrence: taskData.recurrence ? [taskData.recurrence] : undefined,
    };
    if (!token || !navigator.onLine) {
      // Queue offline
      setOfflineQueue([...getOfflineQueue(), { type: "add", event }]);
      setTasks((prev) => [...prev, { ...event, id: `offline-${Date.now()}` }]);
      return;
    }
    const res = await fetch(CALENDAR_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });
    const data = await res.json();
    setTasks((prev) => [...prev, data]);
  };

  // Update task (update event)
  const updateTask = async (id: string, updates: any) => {
    const token = getAccessToken();
    if (!token || !navigator.onLine) {
      setOfflineQueue([...getOfflineQueue(), { type: "update", id, updates }]);
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
      return;
    }
    await fetch(`${CALENDAR_API_URL}/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  // Delete task (delete event)
  const deleteTask = async (id: string) => {
    const token = getAccessToken();
    if (!token || !navigator.onLine) {
      setOfflineQueue([...getOfflineQueue(), { type: "delete", id }]);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      return;
    }
    await fetch(`${CALENDAR_API_URL}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync offline queue
  const syncOfflineQueue = useCallback(async () => {
    const token = getAccessToken();
    if (!token || !navigator.onLine) return;
    const queue = getOfflineQueue();
    for (const item of queue) {
      if (item.type === "add") {
        await fetch(CALENDAR_API_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(item.event),
        });
      } else if (item.type === "update") {
        await fetch(`${CALENDAR_API_URL}/${item.id}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(item.updates),
        });
      } else if (item.type === "delete") {
        await fetch(`${CALENDAR_API_URL}/${item.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    }
    setOfflineQueue([]);
    fetchTasks();
  }, [fetchTasks]);

  // On login/online, sync offline queue and fetch tasks
  useEffect(() => {
    if (navigator.onLine) {
      syncOfflineQueue();
      fetchTasks();
    }
    // Listen for online event
    window.addEventListener("online", syncOfflineQueue);
    return () => window.removeEventListener("online", syncOfflineQueue);
  }, [syncOfflineQueue, fetchTasks]);

  // Expose task helpers for planner views
  const getTasksForDate = (date: string) => {
    return tasks.filter((task) => {
      const taskDate = task.start?.dateTime?.split("T")[0];
      return taskDate === date;
    });
  };

  const getUnscheduledTasks = () => {
    return tasks.filter((task) => !task.start?.dateTime);
  };

  return {
    tasks,
    loading,
    addTask,
    updateTask,
    deleteTask,
    getTasksForDate,
    getUnscheduledTasks,
    fetchTasks,
    syncOfflineQueue,
  };
}
