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
  const { isSignedIn, user, signInRequired, signIn } = useGoogleAuth();

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
    updateTask(task.id, { completed: !task.completed })
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
      {/* Sign-in Required Overlay */}
      {signInRequired && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-card border rounded-2xl shadow-2xl p-8 max-w-xs w-full flex flex-col items-center text-center gap-6">
            <svg width="48" height="48" viewBox="0 0 48 48" className="mb-2"><circle cx="24" cy="24" r="24" fill="#F5F5F5"/><path d="M24 14a6 6 0 0 1 6 6v2h-2v-2a4 4 0 0 0-8 0v2h-2v-2a6 6 0 0 1 6-6zm-8 10h16a2 2 0 0 1 2 2v8a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4v-8a2 2 0 0 1 2-2zm0 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8H16z" fill="#222"/></svg>
            <h2 className="text-2xl font-bold mb-1">Sign in to continue</h2>
            <Button onClick={signIn} className="w-full bg-accent-color hover:bg-accent-color-hover text-white text-lg py-3 rounded-xl shadow-md">
              <svg width="20" height="20" viewBox="0 0 48 48" className="inline-block mr-2 align-middle"><g><path fill="#4285F4" d="M43.6 20.5H42V20H24v8h11.3C34.7 32.1 30.1 35 24 35c-6.1 0-11.3-4.1-13.1-9.6-0.4-1-0.6-2-0.6-3.1s0.2-2.1 0.6-3.1C12.7 15.1 17.9 11 24 11c3.1 0 6 1.1 8.2 2.9l6.2-6.2C34.5 4.5 29.5 2 24 2 15.1 2 7.6 7.6 6.3 14.7z"/><path fill="#34A853" d="M6.3 14.7l6.6 4.8C14.3 16.1 18.8 13 24 13c3.1 0 6 1.1 8.2 2.9l6.2-6.2C34.5 4.5 29.5 2 24 2 15.1 2 7.6 7.6 6.3 14.7z"/><path fill="#FBBC05" d="M24 44c5.5 0 10.5-2.1 14.3-5.7l-6.6-5.4C29.9 34.9 27.1 36 24 36c-6.1 0-11.3-4.1-13.1-9.6l-6.6 5.1C7.6 40.4 15.1 44 24 44z"/><path fill="#EA4335" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-4.1 5.5-7.3 5.5-4.1 0-7.5-3.4-7.5-7.5s3.4-7.5 7.5-7.5c1.7 0 3.2 0.6 4.4 1.6l6.2-6.2C34.5 4.5 29.5 2 24 2 15.1 2 7.6 7.6 6.3 14.7z"/></g></svg>
              Sign in with Google
            </Button>
          </div>
        </div>
      )}
      {/* Hide rest of UI if sign-in required */}
      {!signInRequired && (
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
      )}
    </>
  )
}
