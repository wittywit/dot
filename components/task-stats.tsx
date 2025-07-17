"use client"

import { Target, Calendar, CheckCircle, List } from "lucide-react"
import type { TaskStats } from "../types/task"

interface TaskStatsProps {
  stats: TaskStats
  onClose: () => void
}

export function TaskStatsModal({ stats, onClose }: TaskStatsProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-background border rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Your Statistics</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Today's Progress */}
          <div className="bg-yellow-subtle p-4 rounded-lg border-l-4 border-yellow-bright">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-yellow-bright" />
              <span className="text-sm font-medium">Today</span>
            </div>
            <div className="text-2xl font-bold">
              {stats.todayCompleted}/{stats.todayTasks}
            </div>
            <div className="text-xs task-details">Tasks completed</div>
          </div>

          {/* Overall Completion Rate */}
          <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border-l-4 border-green-500">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">Overall</span>
            </div>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.completionRate}%</div>
            <div className="text-xs task-details">Completion rate</div>
          </div>

          {/* Total Tasks */}
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border-l-4 border-blue-500">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Total</span>
            </div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.completedTasks}</div>
            <div className="text-xs task-details">Tasks completed</div>
          </div>

          {/* Unscheduled Tasks */}
          <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg border-l-4 border-purple-500">
            <div className="flex items-center gap-2 mb-2">
              <List className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800 dark:text-purple-200">Unscheduled</span>
            </div>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.unscheduledTasks}</div>
            <div className="text-xs task-details">Tasks in list</div>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full bg-yellow-bright hover:bg-yellow-bright-hover text-black font-medium py-2 px-4 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
