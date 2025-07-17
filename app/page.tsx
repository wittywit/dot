"use client"

import { useState, useEffect } from "react"
import { Calendar, Menu, Plus, ChevronLeft, ChevronRight, BarChart3, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TaskForm } from "../components/task-form"
import { DayView } from "../components/day-view"
import { WeeklyView } from "../components/weekly-view"
import { MonthlyView } from "../components/monthly-view"
import { TaskListView } from "../components/task-list-view"
import { SettingsMenu } from "../components/settings-menu"
import { TaskStatsModal } from "../components/task-stats"
import { useTasks } from "../hooks/use-tasks"
import { useSettings } from "../hooks/use-settings"
import { useTaskStats } from "../hooks/use-task-stats"
import { useNotifications } from "../hooks/use-notifications"
import { useDarkMode } from "../hooks/use-dark-mode"
import { useSettingsSync } from "../hooks/use-settings-sync"
import type { Task } from "../types/task"

export default function DayPlannerApp() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [selectedTime, setSelectedTime] = useState<string>()
  const { tasks, addTask, scheduleTask, toggleTask, deleteTask, getTasksForDate, getUnscheduledTasks } = useTasks()
  const [view, setView] = useState<"day" | "week" | "month" | "list">("day")
  const [showSettings, setShowSettings] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const { settings } = useSettings()
  const { isDarkMode } = useDarkMode()
  const stats = useTaskStats(tasks)

  const { requestPermission, showNotification, showTaskCompleted, showNextTask } = useNotifications(
    tasks,
    settings.notifications,
  )

  useSettingsSync()

  // Get tasks for the selected date, considering day start time logic
  const getTasksForSelectedDate = (date: string) => {
    const dayStartTime = settings.dayStartTime
    const currentDate = new Date(date)
    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + 1)

    const currentDateStr = currentDate.toISOString().split("T")[0]
    const nextDateStr = nextDate.toISOString().split("T")[0]

    // Get tasks from both current and next day that fall within the day view
    const allTasks = tasks.filter((task) => {
      if (!task.isScheduled || !task.time || !task.date) return false

      const taskHour = Number.parseInt(task.time.split(":")[0])

      // Tasks from current date that are >= dayStartTime
      if (task.date === currentDateStr && taskHour >= dayStartTime) {
        return true
      }

      // Tasks from next date that are < dayStartTime
      if (task.date === nextDateStr && taskHour < dayStartTime) {
        return true
      }

      return false
    })

    return allTasks.sort((a, b) => {
      const aHour = Number.parseInt(a.time!.split(":")[0])
      const bHour = Number.parseInt(b.time!.split(":")[0])

      // Adjust hours for sorting (hours before dayStartTime are treated as next day)
      const adjustedAHour = aHour < dayStartTime ? aHour + 24 : aHour
      const adjustedBHour = bHour < dayStartTime ? bHour + 24 : bHour

      if (adjustedAHour !== adjustedBHour) {
        return adjustedAHour - adjustedBHour
      }

      return (a.time || "").localeCompare(b.time || "")
    })
  }

  const todayTasks = getTasksForSelectedDate(selectedDate)
  const unscheduledTasks = getUnscheduledTasks()

  const handleTimeSlotClick = (time: string) => {
    setSelectedTime(time)
    setShowTaskForm(true)
  }

  const handleTaskClick = (task: Task) => {
    const wasCompleted = task.completed
    toggleTask(task.id)

    // Show completion notification if task was just completed
    if (!wasCompleted && settings.notifications) {
      showTaskCompleted(task)
    }
  }

  const handleTaskCompleted = (completedTask: Task) => {
    // Find next task and show notification
    const now = new Date()
    const currentTimeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`

    const nextTask = todayTasks
      .filter((task) => !task.completed && task.time && task.time > currentTimeStr && task.id !== completedTask.id)
      .sort((a, b) => (a.time || "").localeCompare(b.time || ""))[0]

    if (nextTask && settings.notifications) {
      setTimeout(() => {
        showNextTask(nextTask)
      }, 1000) // Delay to show after completion notification
    }
  }

  const handleAddTask = (taskData: any) => {
    addTask(taskData)

    // Show success notification
    if (settings.notifications) {
      showNotification("✅ Task Added!", {
        body: `"${taskData.title}" has been ${taskData.isScheduled ? "scheduled" : "added to your list"}`,
      })
    }
  }

  const handleScheduleTask = (id: string, date: string, time: string, duration: number) => {
    scheduleTask(id, date, time, duration)

    // Show success notification
    if (settings.notifications) {
      showNotification("📅 Task Scheduled!", {
        body: `Task has been scheduled for ${time} on ${new Date(date).toLocaleDateString()}`,
      })
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    })
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good Morning"
    if (hour < 18) return "Good Afternoon"
    return "Good Evening"
  }

  const navigateDate = (direction: "prev" | "next") => {
    const currentDate = new Date(selectedDate)
    if (direction === "prev") {
      currentDate.setDate(currentDate.getDate() - 1)
    } else {
      currentDate.setDate(currentDate.getDate() + 1)
    }
    setSelectedDate(currentDate.toISOString().split("T")[0])
  }

  const goToToday = () => {
    setSelectedDate(new Date().toISOString().split("T")[0])
  }

  // Auto-scroll to current time when switching to day view
  const handleViewChange = (newView: "day" | "week" | "month" | "list") => {
    setView(newView)

    // If switching to day view and viewing today, trigger auto-scroll
    if (newView === "day" && selectedDate === new Date().toISOString().split("T")[0]) {
      // Small delay to ensure the view has rendered
      setTimeout(() => {
        const currentHourElement = document.querySelector(".current-hour")
        if (currentHourElement) {
          currentHourElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          })
        }
      }, 100)
    }
  }

  // Request notification permission on first load
  useEffect(() => {
    if (settings.notifications) {
      requestPermission()
    }
  }, [settings.notifications, requestPermission])

  useEffect(() => {
    const handleSettingsChange = () => {
      // Force a re-render by updating a dummy state
      setSelectedDate((prev) => prev) // This triggers a re-render
    }

    window.addEventListener("settings-changed", handleSettingsChange)
    window.addEventListener("settings-updated", handleSettingsChange)

    return () => {
      window.removeEventListener("settings-changed", handleSettingsChange)
      window.removeEventListener("settings-updated", handleSettingsChange)
    }
  }, [])

  // Apply accent color on mount
  useEffect(() => {
    document.documentElement.classList.remove(
      "accent-yellow",
      "accent-blue",
      "accent-green",
      "accent-purple",
      "accent-red",
      "accent-orange",
    )
    document.documentElement.classList.add(`accent-${settings.accentColor}`)
  }, [settings.accentColor])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={goToToday}>
              <Calendar className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShowStats(true)}>
              <BarChart3 className="h-5 w-5" />
            </Button>
          </div>

          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold mb-1 greeting-text">
              {getGreeting()}, {settings.name}!
            </h1>
            <p className="text-muted-foreground">Make your day.</p>
          </div>

          {/* Date Navigation - Only show for scheduled views */}
          {view !== "list" && (
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="icon" onClick={() => navigateDate("prev")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Today's plan</div>
                <div className="font-medium day-date">{formatDate(selectedDate)}</div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => navigateDate("next")}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* View Toggle */}
          <div className="flex justify-center mb-4">
            <div className="bg-muted rounded-lg p-1 flex">
              <Button
                variant={view === "day" ? "default" : "ghost"}
                size="sm"
                onClick={() => handleViewChange("day")}
                className={view === "day" ? "view-toggle-active" : ""}
              >
                Day
              </Button>
              <Button
                variant={view === "week" ? "default" : "ghost"}
                size="sm"
                onClick={() => handleViewChange("week")}
                className={view === "week" ? "view-toggle-active" : ""}
              >
                Week
              </Button>
              <Button
                variant={view === "month" ? "default" : "ghost"}
                size="sm"
                onClick={() => handleViewChange("month")}
                className={view === "month" ? "view-toggle-active" : ""}
              >
                Month
              </Button>
              <Button
                variant={view === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => handleViewChange("list")}
                className={view === "list" ? "view-toggle-active" : ""}
              >
                <List className="h-4 w-4 mr-1" />
                List
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto p-4">
        {view === "day" && (
          <DayView
            date={selectedDate}
            tasks={todayTasks}
            onTaskClick={handleTaskClick}
            onTimeSlotClick={handleTimeSlotClick}
            dayStartTime={settings.dayStartTime}
            onTaskCompleted={handleTaskCompleted}
          />
        )}
        {view === "week" && (
          <WeeklyView
            tasks={tasks.filter((task) => task.isScheduled)}
            onTaskClick={handleTaskClick}
            onDateSelect={(date) => {
              setSelectedDate(date)
              setView("day")
            }}
          />
        )}
        {view === "month" && (
          <MonthlyView
            tasks={tasks.filter((task) => task.isScheduled)}
            onTaskClick={handleTaskClick}
            onDateSelect={(date) => {
              setSelectedDate(date)
              setView("day")
            }}
          />
        )}
        {view === "list" && (
          <TaskListView
            tasks={unscheduledTasks}
            onTaskClick={handleTaskClick}
            onAddTask={handleAddTask}
            onScheduleTask={handleScheduleTask}
            onDeleteTask={deleteTask}
          />
        )}
      </div>

      {/* Floating Add Button */}
      <div className="fixed bottom-6 right-6">
        <Button
          onClick={() => setShowTaskForm(true)}
          className="h-14 w-14 rounded-full bg-accent-color hover:bg-accent-color-hover text-white shadow-lg"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskForm
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          onSubmit={handleAddTask}
          onClose={() => {
            setShowTaskForm(false)
            setSelectedTime(undefined)
          }}
          dayStartTime={settings.dayStartTime}
        />
      )}

      {/* Settings Modal */}
      {showSettings && <SettingsMenu onClose={() => setShowSettings(false)} />}

      {/* Stats Modal */}
      {showStats && <TaskStatsModal stats={stats} onClose={() => setShowStats(false)} />}
    </div>
  )
}
