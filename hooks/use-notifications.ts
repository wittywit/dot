"use client"

import { useEffect, useCallback } from "react"
import type { Task } from "../types/task"

export function useNotifications(tasks: Task[], enabled: boolean) {
  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications")
      return false
    }

    if (Notification.permission === "granted") {
      return true
    }

    if (Notification.permission === "denied") {
      return false
    }

    const permission = await Notification.requestPermission()
    return permission === "granted"
  }, [])

  // Show notification
  const showNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!enabled || !("Notification" in window) || Notification.permission !== "granted") {
        return
      }

      const notification = new Notification(title, {
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        ...options,
      })

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close()
      }, 5000)

      return notification
    },
    [enabled],
  )

  // Show task reminder
  const showTaskReminder = useCallback(
    (task: Task) => {
      showNotification(`Reminder: ${task.title}`, {
        body: task.note || `Scheduled for ${task.time}`,
        tag: `reminder-${task.id}`,
        requireInteraction: true,
      })
    },
    [showNotification],
  )

  // Show task completion notification
  const showTaskCompleted = useCallback(
    (task: Task) => {
      showNotification(`✅ Task Completed!`, {
        body: `"${task.title}" has been marked as done`,
        tag: `completed-${task.id}`,
      })
    },
    [showNotification],
  )

  // Show upcoming task notification
  const showUpcomingTask = useCallback(
    (task: Task, minutesUntil: number) => {
      showNotification(`⏰ Upcoming Task`, {
        body: `"${task.title}" starts in ${minutesUntil} minutes`,
        tag: `upcoming-${task.id}`,
      })
    },
    [showNotification],
  )

  // Show next task notification
  const showNextTask = useCallback(
    (task: Task) => {
      showNotification(`🎯 Next Task`, {
        body: `Up next: "${task.title}" at ${task.time}`,
        tag: `next-${task.id}`,
      })
    },
    [showNotification],
  )

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return

    // Request permission on first load
    requestPermission()

    const checkNotifications = () => {
      const now = new Date()
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`
      const today = now.toISOString().split("T")[0]

      tasks.forEach((task) => {
        if (!task.isScheduled || task.completed || task.date !== today) return

        const taskTime = task.time
        if (!taskTime) return

        // Parse task time
        const [taskHour, taskMinute] = taskTime.split(":").map(Number)
        const taskDate = new Date(now)
        taskDate.setHours(taskHour, taskMinute, 0, 0)

        const timeDiff = taskDate.getTime() - now.getTime()
        const minutesUntil = Math.floor(timeDiff / (1000 * 60))

        // Reminder notification (exact time)
        if (task.reminder && currentTime === taskTime) {
          showTaskReminder(task)
        }

        // Upcoming task notifications (5 and 15 minutes before)
        if (minutesUntil === 15 || minutesUntil === 5) {
          showUpcomingTask(task, minutesUntil)
        }
      })
    }

    // Check every minute
    const interval = setInterval(checkNotifications, 60000)

    // Check immediately
    checkNotifications()

    return () => clearInterval(interval)
  }, [tasks, enabled, requestPermission, showTaskReminder, showUpcomingTask])

  return {
    requestPermission,
    showNotification,
    showTaskReminder,
    showTaskCompleted,
    showUpcomingTask,
    showNextTask,
  }
}
