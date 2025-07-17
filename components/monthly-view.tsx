"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Task } from "../types/task"

interface MonthlyViewProps {
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onDateSelect: (date: string) => void
}

export function MonthlyView({ tasks, onTaskClick, onDateSelect }: MonthlyViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const getMonthDates = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    const endDate = new Date(lastDay)

    // Adjust to start from Sunday
    startDate.setDate(startDate.getDate() - startDate.getDay())

    // Adjust to end on Saturday
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()))

    const dates = []
    const current = new Date(startDate)

    while (current <= endDate) {
      dates.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return dates
  }

  const monthDates = getMonthDates(currentMonth)

  const navigateMonth = (direction: "prev" | "next") => {
    const newMonth = new Date(currentMonth)
    newMonth.setMonth(currentMonth.getMonth() + (direction === "next" ? 1 : -1))
    setCurrentMonth(newMonth)
  }

  const getTasksForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0]
    return tasks.filter((task) => task.date === dateStr)
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth()
  }

  const isToday = (date: Date) => {
    return date.toDateString() === new Date().toDateString()
  }

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  }

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigateMonth("prev")}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="font-semibold">{formatMonth(currentMonth)}</h3>
        <Button variant="ghost" size="icon" onClick={() => navigateMonth("next")}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Week Headers */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 p-2">
            {day}
          </div>
        ))}
      </div>

      {/* Month Grid */}
      <div className="grid grid-cols-7 gap-1">
        {monthDates.map((date, index) => {
          const dayTasks = getTasksForDate(date)
          const completedTasks = dayTasks.filter((task) => task.completed)
          const isCurrentMonthDate = isCurrentMonth(date)
          const isTodayDate = isToday(date)

          return (
            <div
              key={index}
              onClick={() => onDateSelect(date.toISOString().split("T")[0])}
              className={`aspect-square p-1 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                isTodayDate
                  ? "task-highlight-today"
                  : isCurrentMonthDate
                    ? "bg-card border border-border"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              <div className="h-full flex flex-col">
                <div
                  className={`text-xs font-medium mb-1 ${
                    isTodayDate ? "text-yellow-800 dark:text-yellow-600" : "text-foreground"
                  }`}
                >
                  {date.getDate()}
                </div>

                {dayTasks.length > 0 && (
                  <div className="flex-1 space-y-0.5">
                    {dayTasks.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          onTaskClick(task)
                        }}
                        className={`w-full h-1 rounded transition-colors ${
                          task.completed
                            ? "bg-gray-400 dark:bg-gray-600"
                            : "bg-yellow-bright hover:bg-yellow-bright-hover"
                        }`}
                      />
                    ))}
                    {dayTasks.length > 3 && (
                      <div className="text-xs task-details text-center font-medium">+{dayTasks.length - 3}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
