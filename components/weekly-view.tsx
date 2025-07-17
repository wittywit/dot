"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Task } from "../types/task"

interface WeeklyViewProps {
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onDateSelect: (date: string) => void
}

export function WeeklyView({ tasks, onTaskClick, onDateSelect }: WeeklyViewProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date())

  const getWeekDates = (date: Date) => {
    const week = []
    const startOfWeek = new Date(date)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day

    startOfWeek.setDate(diff)

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      week.push(day)
    }

    return week
  }

  const weekDates = getWeekDates(currentWeek)

  const navigateWeek = (direction: "prev" | "next") => {
    const newWeek = new Date(currentWeek)
    newWeek.setDate(currentWeek.getDate() + (direction === "next" ? 7 : -7))
    setCurrentWeek(newWeek)
  }

  const getTasksForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0]
    return tasks.filter((task) => task.date === dateStr)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const getDayName = (date: Date) => {
    return date.toLocaleDateString("en-US", { weekday: "short" })
  }

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigateWeek("prev")}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="font-semibold">
          {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
        </h3>
        <Button variant="ghost" size="icon" onClick={() => navigateWeek("next")}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDates.map((date, index) => {
          const dayTasks = getTasksForDate(date)
          const completedTasks = dayTasks.filter((task) => task.completed)
          const isToday = date.toDateString() === new Date().toDateString()

          return (
            <div
              key={index}
              onClick={() => onDateSelect(date.toISOString().split("T")[0])}
              className={`p-2 rounded-lg border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                isToday ? "task-highlight-today" : "bg-card border-border"
              }`}
            >
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">{getDayName(date)}</div>
                <div className={`text-sm font-medium mb-2 ${isToday ? "text-yellow-800 dark:text-yellow-600" : ""}`}>
                  {date.getDate()}
                </div>

                {dayTasks.length > 0 && (
                  <div className="space-y-1">
                    {dayTasks.slice(0, 2).map((task) => (
                      <div
                        key={task.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          onTaskClick(task)
                        }}
                        className={`text-xs p-1 rounded truncate task-mini-card ${
                          task.completed ? "completed line-through" : ""
                        }`}
                      >
                        {task.title}
                      </div>
                    ))}
                    {dayTasks.length > 2 && <div className="text-xs text-gray-400">+{dayTasks.length - 2} more</div>}
                  </div>
                )}

                {dayTasks.length > 0 && (
                  <div className="mt-2 text-xs task-details font-medium">
                    {completedTasks.length}/{dayTasks.length}
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
