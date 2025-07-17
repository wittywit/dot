"use client"

import { useMemo } from "react"
import type { Task, TaskStats } from "../types/task"

export function useTaskStats(tasks: Task[]): TaskStats {
  return useMemo(() => {
    const today = new Date().toISOString().split("T")[0]
    const scheduledTasks = tasks.filter((task) => task.isScheduled)
    const todayTasks = scheduledTasks.filter((task) => task.date === today)
    const completedTasks = tasks.filter((task) => task.completed)
    const todayCompleted = todayTasks.filter((task) => task.completed)
    const unscheduledTasks = tasks.filter((task) => !task.isScheduled)

    // Calculate streak (consecutive days with completed tasks)
    const getStreakDays = () => {
      const dates = [...new Set(scheduledTasks.map((task) => task.date))].sort().reverse()
      let streak = 0
      const currentDate = new Date()

      for (const date of dates) {
        if (!date) continue
        const dateObj = new Date(date)
        const daysDiff = Math.floor((currentDate.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24))

        if (daysDiff === streak) {
          const dayTasks = scheduledTasks.filter((task) => task.date === date)
          const dayCompleted = dayTasks.filter((task) => task.completed)

          if (dayCompleted.length > 0) {
            streak++
          } else {
            break
          }
        } else {
          break
        }
      }

      return streak
    }

    return {
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      completionRate: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
      streakDays: getStreakDays(),
      todayTasks: todayTasks.length,
      todayCompleted: todayCompleted.length,
      unscheduledTasks: unscheduledTasks.length,
    }
  }, [tasks])
}
