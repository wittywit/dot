"use client"

import { useLocalStorage } from "./use-local-storage"
import type { Task } from "../types/task"
import { v4 as uuidv4 } from "uuid"

export function useTasks() {
  const [tasks, setTasks] = useLocalStorage<Task[]>("day-planner-tasks", [])

  const addTask = (taskData: Omit<Task, "id" | "completed">) => {
    const newTask: Task = {
      ...taskData,
      id: uuidv4(),
      completed: false,
    }

    // Handle recurring tasks only if scheduled
    if (taskData.recurring && taskData.isScheduled) {
      const recurringTasks = generateRecurringTasks(newTask)
      setTasks((prev) => [...prev, ...recurringTasks])
    } else {
      setTasks((prev) => [...prev, newTask])
    }
  }

  const scheduleTask = (id: string, date: string, time: string, duration = 60) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, date, time, duration, isScheduled: true } : task)),
    )
  }

  const toggleTask = (id: string) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)))
  }

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id))
  }

  const getTasksForDate = (date: string) => {
    return tasks
      .filter((task) => task.date === date && task.isScheduled)
      .sort((a, b) => (a.time || "").localeCompare(b.time || ""))
  }

  const getUnscheduledTasks = () => {
    return tasks.filter((task) => !task.isScheduled)
  }

  const generateRecurringTasks = (baseTask: Task): Task[] => {
    if (!baseTask.recurring || !baseTask.isScheduled) return [baseTask]

    const tasks: Task[] = []
    const startDate = new Date(baseTask.date!)
    const endDate = baseTask.recurring.endDate
      ? new Date(baseTask.recurring.endDate)
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now

    const currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      tasks.push({
        ...baseTask,
        id: uuidv4(),
        date: currentDate.toISOString().split("T")[0],
      })

      switch (baseTask.recurring.type) {
        case "daily":
          currentDate.setDate(currentDate.getDate() + 1)
          break
        case "weekly":
          currentDate.setDate(currentDate.getDate() + 7)
          break
        case "monthly":
          currentDate.setMonth(currentDate.getMonth() + 1)
          break
      }
    }

    return tasks
  }

  return {
    tasks,
    addTask,
    scheduleTask,
    toggleTask,
    deleteTask,
    getTasksForDate,
    getUnscheduledTasks,
  }
}
