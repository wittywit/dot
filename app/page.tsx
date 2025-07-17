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
import { useGoogleAuth } from "../components/GoogleAuthContext";

export default function DayPlannerApp() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [selectedTime, setSelectedTime] = useState<string>()
  const { tasks, addTask, updateTask, deleteTask, getTasksForDate, getUnscheduledTasks, loading } = useTasks()
  const [view, setView] = useState<"day" | "week" | "month" | "list">("day")
  const [showSettings, setShowSettings] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const { settings } = useSettings()
  const { isDarkMode } = useDarkMode()
  const stats = useTaskStats(tasks)
  const { isSignedIn, user } = useGoogleAuth();

  const { requestPermission, showNotification, showTaskCompleted, showNextTask } = useNotifications(
    tasks,
    settings.notifications,
  )

  useSettingsSync()

  // Get tasks for the selected date
  const todayTasks = getTasksForDate(selectedDate)
  const unscheduledTasks = getUnscheduledTasks()

  const handleTimeSlotClick = (time: string) => {
    setSelectedTime(time)
    setShowTaskForm(true)
  }

  const handleTaskClick = (task: any) => {
    // Optionally, implement toggle/complete logic with updateTask
  }

  const handleTaskCompleted = (completedTask: any) => {
    // Optionally, implement completion logic with updateTask
  }

  const handleAddTask = (taskData: any) => {
    addTask(taskData)
    if (settings.notifications) {
      showNotification("✅ Task Added!", {
        body: `"${taskData.title}" has been added to your calendar`,
      })
    }
  }

  const handleScheduleTask = (id: string, date: string, time: string, duration: number) => {
    // Optionally, implement scheduling logic with updateTask
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
    <>
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
              {getGreeting()}, {user && user.name ? user.name : settings.name}!
            </h1>
            {user && user.imageUrl && (
              <img src={user.imageUrl} alt={user.name} style={{ width: 36, height: 36, borderRadius: "50%", display: "inline-block", marginBottom: 4 }} />
            )}
            <p className="text-muted-foreground">Make your day.</p>
          </div>

          {/* Date Navigation - Only show for scheduled views */}
          {view !== "list" && (
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="icon" onClick={() => navigateDate("prev")}> <ChevronLeft className="h-4 w-4" /> </Button>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Today's plan</div>
                <div className="font-medium day-date">{formatDate(selectedDate)}</div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => navigateDate("next")}> <ChevronRight className="h-4 w-4" /> </Button>
            </div>
          )}

          {/* View Toggle */}
          <div className="flex justify-center mb-4">
            <div className="bg-muted rounded-lg p-1 flex">
              <Button
                variant={view === "day" ? "default" : "ghost"}
                size="sm"
                onClick={() => setView("day")}
                className={view === "day" ? "view-toggle-active" : ""}
              >
                Day
              </Button>
              <Button
                variant={view === "week" ? "default" : "ghost"}
                size="sm"
                onClick={() => setView("week")}
                className={view === "week" ? "view-toggle-active" : ""}
              >
                Week
              </Button>
              <Button
                variant={view === "month" ? "default" : "ghost"}
                size="sm"
                onClick={() => setView("month")}
                className={view === "month" ? "view-toggle-active" : ""}
              >
                Month
              </Button>
              <Button
                variant={view === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setView("list")}
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
        {loading && <div>Loading your Google Calendar events...</div>}
        {!loading && view === "day" && (
          <DayView
            date={selectedDate}
            tasks={todayTasks}
            onTaskClick={handleTaskClick}
            onTimeSlotClick={handleTimeSlotClick}
            dayStartTime={settings.dayStartTime}
            onTaskCompleted={handleTaskCompleted}
          />
        )}
        {!loading && view === "week" && (
          <WeeklyView
            tasks={tasks.filter((task) => task.start?.dateTime)}
            onTaskClick={handleTaskClick}
            onDateSelect={(date) => {
              setSelectedDate(date)
              setView("day")
            }}
          />
        )}
        {!loading && view === "month" && (
          <MonthlyView
            tasks={tasks.filter((task) => task.start?.dateTime)}
            onTaskClick={handleTaskClick}
            onDateSelect={(date) => {
              setSelectedDate(date)
              setView("day")
            }}
          />
        )}
        {!loading && view === "list" && (
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
    </>
  )
}
