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
            let mapped = {
              ...event,
              title: event.summary,
              note: event.description,
              isAllDay: false,
            };
            if (event.recurrence && event.start && event.start.date && !event.start.dateTime) {
              mapped = {
                ...mapped,
                start: { dateTime: event.start.date + "T10:00:00" },
                end: { dateTime: event.end.date + "T11:00:00" },
                isAllDay: true,
              };
            }
            return mapped;
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
    if (!token) {
      alert("You must be signed in to add a task. Please sign in with Google.");
      return;
    }
    // Determine if this is an all-day event (robust)
    let start, end;
    if (taskData.isAllDay && taskData.date) {
      // All-day event: use date only, end is next day
      const startDate = taskData.date;
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      start = { date: startDate };
      end = { date: endDate.toISOString().split('T')[0] };
    } else if (taskData.dateTime) {
      // Timed event: use dateTime only
      start = { dateTime: taskData.dateTime };
      end = { dateTime: taskData.endDateTime || taskData.dateTime };
    } else {
      alert('Task is missing required date or time information.');
      return;
    }
    const event = {
      summary: taskData.title,
      description: taskData.note || taskData.description || "",
      start,
      end,
      recurrence: taskData.recurrence ? [taskData.recurrence] : undefined,
    };
    // Log the event object for debugging
    console.log("[addTask] Event object to send:", event);
    if (!navigator.onLine) {
      // Queue offline
      setOfflineQueue([...getOfflineQueue(), { type: "add", event }]);
      setTasks((prev) => [...prev, { ...event, id: `offline-${Date.now()}` }]);
      return;
    }
    try {
      console.log("[addTask] Using access token:", token);
      const res = await fetch(CALENDAR_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error("[addTask] Google Calendar API error:", res.status, errorText);
        if (res.status === 401 || res.status === 403) {
          alert("Your Google session has expired or is invalid. Please sign in again.\n\n" + errorText);
          window.dispatchEvent(new Event("dot-gcal-token-updated"));
        } else {
          alert("Failed to add task. Google API error: " + errorText);
        }
        return;
      }
      const data = await res.json();
      setTasks((prev) => [...prev, data]);
    } catch (err) {
      console.error("[addTask] Exception:", err);
      let msg = "";
      if (err instanceof Error) {
        msg = err.message;
      } else if (typeof err === "string") {
        msg = err;
      } else {
        msg = JSON.stringify(err);
      }
      alert("Failed to add task. Please check your sign-in and try again.\n\n" + msg);
    }
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

  // Listen for Google token changes and refetch tasks
  useEffect(() => {
    const handler = () => {
      fetchTasks();
    };
    window.addEventListener("dot-gcal-token-updated", handler);
    return () => window.removeEventListener("dot-gcal-token-updated", handler);
  }, [fetchTasks]);

  // Expose task helpers for planner views
  const getTasksForDate = (date: string) => {
    return tasks.filter((task) => {
      const taskDate = task.start?.dateTime?.split("T")[0];
      return taskDate === date;
    });
  };

  // Show all tasks in the list view for now
  const getUnscheduledTasks = () => {
    return tasks;
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
