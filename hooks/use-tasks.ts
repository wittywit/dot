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

// Local-only tasks persistence
const LOCAL_LIST_KEY = "dot-local-list-tasks";
const LOCAL_COMPLETED_KEY = "dot-completed-tasks";
function loadLocalListTasks() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_LIST_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveLocalListTasks(tasks: any[]) {
  localStorage.setItem(LOCAL_LIST_KEY, JSON.stringify(tasks));
}
function loadCompletedMap() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_COMPLETED_KEY) || "{}") || {};
  } catch {
    return {};
  }
}
function saveCompletedMap(map: Record<string, boolean>) {
  localStorage.setItem(LOCAL_COMPLETED_KEY, JSON.stringify(map));
}

export function useTasks() {
  const [tasks, setTasks] = useState<any[]>(() => {
    const locals = loadLocalListTasks();
    const completedMap = loadCompletedMap();
    // Merge completed state for local and Google tasks
    return locals.map((t: any) => ({ ...t, completed: completedMap[t.id] ?? t.completed ?? false }));
  });
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
        const completedMap = loadCompletedMap();
        setTasks((prev: any[]) => {
          // Keep local-only tasks
          const localTasks = prev.filter((t: any) => t.localOnly);
          const gcalTasks = data.items.map((event: any) => {
            // Extract start/end
            let isAllDay = false;
            let isScheduled = false;
            let date = undefined;
            let time = undefined;
            let duration = undefined;
            if (event.start?.dateTime) {
              // Timed event
              isScheduled = true;
              isAllDay = false;
              const startDateTime = new Date(event.start.dateTime);
              const endDateTime = event.end?.dateTime ? new Date(event.end.dateTime) : null;
              date = event.start.dateTime.split("T")[0];
              time = event.start.dateTime.split("T")[1]?.slice(0,5); // HH:MM
              if (endDateTime) {
                duration = Math.round((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60));
              }
            } else if (event.start?.date) {
              // All-day event
              isAllDay = true;
              isScheduled = false;
              date = event.start.date;
              time = undefined;
              duration = undefined;
            }
            // Recurring
            let recurring = undefined;
            if (event.recurrence && event.recurrence.length > 0) {
              recurring = event.recurrence[0];
            }
            // Completed: always merge from completedMap
            return {
              id: event.id,
              title: event.summary,
              note: event.description,
              date,
              time,
              duration,
              isScheduled,
              isAllDay,
              completed: completedMap[event.id] ?? false,
              recurring,
              reminder: undefined,
              raw: event, // for debugging
            };
          });
          return [...localTasks, ...gcalTasks];
        });
      }
    } catch (e) {
      // If offline, keep current tasks
    }
    setLoading(false);
  }, []);

  // Add task (create event)
  const addTask = async (taskData: any) => {
    // If localOnly, just add to local state and persist
    if (taskData.localOnly) {
      const newTask = { ...taskData, id: `local-${Date.now()}` };
      setTasks((prev) => {
        const updated = [...prev, newTask];
        saveLocalListTasks(updated.filter(t => t.localOnly));
        return updated;
      });
      return;
    }
    const token = getAccessToken();
    if (!token) {
      alert("You must be signed in to add a task. Please sign in with Google.");
      return;
    }
    // Determine if this is an all-day event (robust)
    let start, end;
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (taskData.isAllDay && taskData.date) {
      // All-day event: use date only, end is next day
      const startDate = taskData.date;
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      start = { date: startDate };
      end = { date: endDate.toISOString().split('T')[0] };
    } else if (taskData.dateTime) {
      // Timed event: use dateTime and timeZone
      let startDT = taskData.dateTime;
      let endDT = taskData.endDateTime || taskData.dateTime;
      // Ensure end is after start
      if (new Date(endDT) <= new Date(startDT)) {
        const newEnd = new Date(new Date(startDT).getTime() + 60000); // +1 min
        endDT = newEnd.toISOString();
      }
      start = { dateTime: startDT, timeZone };
      end = { dateTime: endDT, timeZone };
    } else {
      alert('Task is missing required date or time information.');
      return;
    }
    // Clean event object: remove undefined/null fields
    function clean(obj: any) {
      if (Array.isArray(obj)) {
        return obj.filter((v) => v !== undefined && v !== null)
      } else if (typeof obj === 'object' && obj !== null) {
        const newObj: any = {}
        for (const k in obj) {
          if (obj[k] !== undefined && obj[k] !== null) {
            newObj[k] = clean(obj[k])
          }
        }
        return newObj
      }
      return obj
    }
    const event = clean({
      summary: taskData.title,
      description: taskData.note || taskData.description || "",
      start,
      end,
      recurrence: (typeof taskData.recurrence === 'string' && taskData.recurrence.length > 0) ? [taskData.recurrence] : undefined,
      // extendedProperties: { private: { completed: taskData.completed ? "1" : "0" } }, // Placeholder for future
    });
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
        let userMsg = "Failed to add task. Google API error: " + errorText;
        if (errorText.includes("dateTime")) userMsg += "\n\nCheck that your start and end times are valid.";
        alert(userMsg);
        console.error("[addTask] Google Calendar API error:", res.status, errorText);
        if (res.status === 401 || res.status === 403) {
          window.dispatchEvent(new Event("dot-gcal-token-updated"));
        }
        return;
      }
      const data = await res.json();
      setTasks((prev) => [...prev, data]);
      // Immediately fetch tasks from Google Calendar to sync
      fetchTasks();
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
    // Update completed state in localStorage
    if (updates.completed !== undefined) {
      const completedMap = loadCompletedMap();
      completedMap[id] = updates.completed;
      saveCompletedMap(completedMap);
    }
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
        // Patch: ensure timeZone is present for timed events in offline queue
        let event = item.event;
        if (event.start && event.start.dateTime && !event.start.timeZone) {
          const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          event = {
            ...event,
            start: { ...event.start, timeZone },
            end: { ...event.end, timeZone },
          };
        }
        await fetch(CALENDAR_API_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event),
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

  // When local-only tasks or completed state change, persist them
  useEffect(() => {
    saveLocalListTasks(tasks.filter((t: any) => t.localOnly));
    // Save completed state for all tasks
    const completedMap: Record<string, boolean> = {};
    for (const t of tasks as any[]) {
      if (t.completed) completedMap[t.id] = true;
      else delete completedMap[t.id];
    }
    saveCompletedMap(completedMap);
  }, [tasks]);

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
      // Prefer mapped task.date, fallback to start.dateTime or start.date
      const taskDate = task.date || task.start?.dateTime?.split("T")[0] || task.start?.date;
      return taskDate === date;
    });
  };

  // Show only user-added list tasks in the list view
  const getUnscheduledTasks = () => {
    return tasks.filter((task) => {
      // Include localOnly tasks, exclude scheduled, all-day, recurring, and imported
      if (task.localOnly) return true;
      const isUserListTask = !task.isScheduled && !task.isAllDay && !task.recurring && (!task.raw || !task.raw.id);
      return isUserListTask;
    });
  };

  // Sync all local-only tasks to Google Calendar
  const syncLocalTasks = async () => {
    const token = getAccessToken();
    if (!token) return;
    // Get all local-only tasks
    const localTasks = tasks.filter((t: any) => t.localOnly);
    // Get all Google Calendar tasks (not localOnly)
    const gcalTasks = tasks.filter((t: any) => !t.localOnly);
    for (const localTask of localTasks) {
      // Deduplication: check for existing task with same title and date/time
      const isDuplicate = gcalTasks.some((g: any) =>
        g.title === localTask.title &&
        ((g.dateTime && localTask.dateTime && g.dateTime === localTask.dateTime) ||
         (g.date && localTask.date && g.date === localTask.date))
      );
      if (!isDuplicate) {
        // Add to Google Calendar
        await addTask({ ...localTask, localOnly: false });
      }
    }
    // Remove localOnly flag from synced tasks
    setTasks((prev: any[]) => prev.map((t: any) => t.localOnly ? { ...t, localOnly: false } : t));
    saveLocalListTasks(tasks.filter((t: any) => t.localOnly));
    fetchTasks();
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
    syncLocalTasks, // expose
  };
}
