"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { Task } from "../types/task"
import { Button } from "@/components/ui/button"
import { Clock, Plus, Bell, ChevronDown, Target, Calendar } from "lucide-react"

interface DayViewProps {
  date: string
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onTimeSlotClick: (time: string) => void
  dayStartTime: number
  onTaskCompleted?: (task: Task) => void
}

export function DayView({ date, tasks, onTaskClick, onTimeSlotClick, dayStartTime, onTaskCompleted }: DayViewProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const currentHourRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hasScrolledRef = useRef(false)
  const taskRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [])

  // Smooth scroll utility
  const smoothScrollTo = useCallback((element: HTMLElement, behavior: ScrollBehavior = "smooth") => {
    element.scrollIntoView({
      behavior,
      block: "center",
      inline: "nearest",
    })
  }, [])

  // Get the actual date for a given hour slot
  const getDateForHour = useCallback(
    (hour: number, baseDate: string) => {
      const date = new Date(baseDate)

      // If hour is before dayStartTime, it belongs to the next day
      if (hour < dayStartTime) {
        date.setDate(date.getDate() + 1)
      }

      return date.toISOString().split("T")[0]
    },
    [dayStartTime],
  )

  // Auto-scroll to current time on mount and when date changes
  useEffect(() => {
    const scrollToCurrentTime = () => {
      const now = new Date()
      const currentHour = now.getHours()
      const actualDateForCurrentHour = getDateForHour(currentHour, now.toISOString().split("T")[0])

      // Only auto-scroll if the current hour belongs to the selected date and haven't scrolled yet
      if (date === actualDateForCurrentHour && currentHourRef.current && !hasScrolledRef.current) {
        setTimeout(() => {
          if (currentHourRef.current) {
            smoothScrollTo(currentHourRef.current)
            hasScrolledRef.current = true
          }
        }, 300)
      }
    }

    scrollToCurrentTime()
  }, [date, smoothScrollTo, getDateForHour])

  // Reset scroll flag when date changes
  useEffect(() => {
    hasScrolledRef.current = false
  }, [date])

  // Get next incomplete task
  const getNextTask = useCallback(() => {
    const now = new Date()
    const currentTimeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`

    return tasks
      .filter((task) => !task.completed && task.time && task.time > currentTimeStr)
      .sort((a, b) => (a.time || "").localeCompare(b.time || ""))[0]
  }, [tasks])

  // Scroll to next task
  const scrollToNextTask = useCallback(() => {
    const nextTask = getNextTask()
    if (nextTask && taskRefs.current[nextTask.id]) {
      const taskElement = taskRefs.current[nextTask.id]
      if (taskElement) {
        smoothScrollTo(taskElement)
      }
    }
  }, [getNextTask, smoothScrollTo])

  // Handle task completion with auto-scroll to next
  const handleTaskClick = useCallback(
    (task: Task) => {
      const wasCompleted = task.completed
      onTaskClick(task)

      // If task was just completed (not uncompleted), scroll to next task
      if (!wasCompleted && onTaskCompleted) {
        onTaskCompleted(task)
        setTimeout(() => {
          scrollToNextTask()
        }, 500) // Small delay to allow state update
      }
    },
    [onTaskClick, onTaskCompleted, scrollToNextTask],
  )

  // Generate hours array with proper day logic
  const hours = Array.from({ length: 24 }, (_, i) => {
    const hour = (dayStartTime + i) % 24
    const hourDate = getDateForHour(hour, date)
    const isNextDay = hourDate !== date

    return {
      hour,
      time: `${hour.toString().padStart(2, "0")}:00`,
      date: hourDate,
      isNextDay,
    }
  })

  const getCurrentTask = () => {
    const now = currentTime
    const currentTimeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`
    const currentHour = now.getHours()
    const actualDateForCurrentHour = getDateForHour(currentHour, now.toISOString().split("T")[0])

    // Only show current task if we're viewing the correct date for current time
    if (date !== actualDateForCurrentHour) return null

    return tasks.find((task) => {
      const taskTime = task.time
      if (!taskTime) return false

      const taskEndTime = new Date(`2000-01-01T${taskTime}`)
      taskEndTime.setMinutes(taskEndTime.getMinutes() + (task.duration || 60))
      const taskEndTimeStr = `${taskEndTime.getHours().toString().padStart(2, "0")}:${taskEndTime.getMinutes().toString().padStart(2, "0")}`

      return currentTimeStr >= taskTime && currentTimeStr < taskEndTimeStr && !task.completed
    })
  }

  const currentTask = getCurrentTask()
  const nextTask = getNextTask()

  const getTasksForHour = (hourData: { hour: number; time: string; date: string; isNextDay: boolean }) => {
    // Get tasks that are scheduled for this specific date and hour
    return tasks.filter((task) => {
      if (!task.time || !task.date) return false

      // Check if task date matches the hour's actual date
      if (task.date !== hourData.date) return false

      // Check if task time starts with this hour
      return task.time.startsWith(hourData.hour.toString().padStart(2, "0"))
    })
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  const isCurrentHour = (hourData: { hour: number; time: string; date: string; isNextDay: boolean }) => {
    const now = currentTime
    const currentHour = now.getHours()
    const actualDateForCurrentHour = getDateForHour(currentHour, now.toISOString().split("T")[0])

    return currentHour === hourData.hour && date === actualDateForCurrentHour
  }

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <div className="flex gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => currentHourRef.current && smoothScrollTo(currentHourRef.current)}
          className="flex items-center gap-2"
        >
          <Clock className="h-4 w-4" />
          Now
        </Button>
        {nextTask && (
          <Button
            variant="outline"
            size="sm"
            onClick={scrollToNextTask}
            className="flex items-center gap-2 bg-transparent"
          >
            <Target className="h-4 w-4" />
            Next Task
          </Button>
        )}
      </div>

      <div ref={containerRef} className="space-y-2">
        {hours.map((hourData, index) => {
          const hourTasks = getTasksForHour(hourData)
          const isCurrent = isCurrentHour(hourData)
          const showDateDivider = index > 0 && hourData.isNextDay && !hours[index - 1].isNextDay

          return (
            <div key={`${hourData.date}-${hourData.hour}`}>
              {/* Date divider for next day */}
              {showDateDivider && (
                <div className="flex items-center gap-3 py-4 my-4">
                  <div className="flex-1 h-px bg-border"></div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-full text-sm font-medium">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDateLabel(hourData.date)}</span>
                    <span className="text-xs text-muted-foreground">(Next Day)</span>
                  </div>
                  <div className="flex-1 h-px bg-border"></div>
                </div>
              )}

              <div
                ref={isCurrent ? currentHourRef : null}
                className={`hour-slot p-3 rounded-lg transition-all duration-300 ${
                  isCurrent ? "current-hour ring-2 ring-accent-color ring-opacity-30" : ""
                } ${hourData.isNextDay ? "bg-muted/30" : ""}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className={`h-4 w-4 ${isCurrent ? "text-accent-color" : "text-gray-500"}`} />
                    <span className={`font-medium hour-time ${isCurrent ? "text-accent-color font-semibold" : ""}`}>
                      {formatTime(hourData.time)}
                    </span>
                    {hourData.isNextDay && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                        Next Day
                      </span>
                    )}
                    {isCurrent && (
                      <span className="text-xs bg-accent-color text-white px-2 py-1 rounded-full font-medium animate-pulse">
                        Now
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onTimeSlotClick(hourData.time)}
                    className="text-gray-500 hover:text-black dark:hover:text-white"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {hourTasks.length > 0 ? (
                  <div className="space-y-2">
                    {hourTasks.map((task) => (
                      <div
                        key={task.id}
                        ref={(el) => (taskRefs.current[task.id] = el)}
                        onClick={() => handleTaskClick(task)}
                        className={`task-card p-3 rounded-lg cursor-pointer transition-all duration-300 ${
                          task.completed
                            ? "bg-gray-100 dark:bg-gray-800 task-completed transform scale-95"
                            : currentTask?.id === task.id
                              ? "current-task transform scale-105"
                              : nextTask?.id === task.id
                                ? "ring-2 ring-accent-color ring-opacity-20 bg-accent-color-light"
                                : "hover:bg-gray-50 dark:hover:bg-gray-700 hover:transform hover:scale-102"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium task-title">{task.title}</span>
                              {task.reminder && <Bell className="h-3 w-3 text-accent-color" />}
                              {currentTask?.id === task.id && (
                                <span className="text-xs bg-accent-color text-white px-2 py-1 rounded-full font-medium animate-pulse">
                                  Active
                                </span>
                              )}
                              {nextTask?.id === task.id && !currentTask && (
                                <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full font-medium">
                                  Next
                                </span>
                              )}
                            </div>
                            <div className="task-time-text text-sm mt-1">
                              {formatTime(task.time || "00:00")} • {task.duration || 60} min
                            </div>
                            {task.note && <div className="task-note-text text-sm mt-1">{task.note}</div>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm italic">No tasks scheduled</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Scroll to bottom helper */}
      <div className="flex justify-center pt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const lastHour = document.querySelector(".hour-slot:last-child")
            if (lastHour) smoothScrollTo(lastHour as HTMLElement)
          }}
          className="text-muted-foreground hover:text-foreground"
        >
          <ChevronDown className="h-4 w-4 mr-1" />
          End of day
        </Button>
      </div>
    </div>
  )
}
