"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Calendar, Trash2, Edit3 } from "lucide-react"
import type { Task } from "../types/task"

interface TaskListViewProps {
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onAddTask: (task: any) => void
  onScheduleTask: (id: string, date: string, time: string, duration: number) => void
  onDeleteTask: (id: string) => void
}

export function TaskListView({ tasks, onTaskClick, onAddTask, onScheduleTask, onDeleteTask }: TaskListViewProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskNote, setNewTaskNote] = useState("")
  const [schedulingTask, setSchedulingTask] = useState<string | null>(null)
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split("T")[0])
  const [scheduleTime, setScheduleTime] = useState("09:00")
  const [scheduleDuration, setScheduleDuration] = useState(60)

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    // Create a local-only list task (not sent to Google Calendar)
    onAddTask({
      title: newTaskTitle.trim(),
      note: newTaskNote.trim(),
      isScheduled: false,
      localOnly: true,
    })

    setNewTaskTitle("")
    setNewTaskNote("")
    setShowAddForm(false)
  }

  const handleScheduleTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!schedulingTask) return

    onScheduleTask(schedulingTask, scheduleDate, scheduleTime, scheduleDuration)
    setSchedulingTask(null)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Task List</h2>
        <Button
          onClick={() => setShowAddForm(true)}
          size="sm"
          className="bg-yellow-bright hover:bg-yellow-bright-hover text-black"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Task
        </Button>
      </div>

      {/* Add Task Form */}
      {showAddForm && (
        <div className="form-card rounded-lg p-4">
          <form onSubmit={handleAddTask} className="space-y-3">
            <Input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Task title"
              required
            />
            <Textarea
              value={newTaskNote}
              onChange={(e) => setNewTaskNote(e.target.value)}
              placeholder="Add a note (optional)"
              rows={2}
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm" className="bg-yellow-bright hover:bg-yellow-bright-hover text-black">
                Add
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Schedule Task Form */}
      {schedulingTask && (
        <div className="form-card rounded-lg p-4">
          <h3 className="font-medium mb-3">Schedule Task</h3>
          <form onSubmit={handleScheduleTask} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm input-label">Date</label>
                <Input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm input-label">Time</label>
                <Input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="text-sm input-label">Duration (minutes)</label>
              <Input
                type="number"
                value={scheduleDuration}
                onChange={(e) => setScheduleDuration(Number.parseInt(e.target.value))}
                min="15"
                step="15"
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" className="bg-yellow-bright hover:bg-yellow-bright-hover text-black">
                Schedule
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setSchedulingTask(null)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-2">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Edit3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No tasks yet. Add your first task above!</p>
          </div>
        ) : (
          <ul className="divide-y divide-muted">
            {tasks.map((task) => (
              <li key={task.id} className="flex items-center gap-3 py-2 group cursor-pointer" onClick={() => onTaskClick(task)}>
                {/* Visual indicator for local-only vs. synced */}
                {(task as any).localOnly ? (
                  <span title="Local task" className="text-gray-400"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3v18m9-9H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></span>
                ) : (
                  <span title="Synced to Google Calendar" className="text-blue-500"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10zm-5 4v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></span>
                )}
                <div className="flex items-center gap-1 ml-2">
                  <Button variant="ghost" size="sm" onClick={() => setSchedulingTask(task.id)} className="h-8 w-8 p-0">
                    <Calendar className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteTask(task.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <span className={task.completed ? "line-through text-muted-foreground" : ""}>{task.title}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
