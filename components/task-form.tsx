"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { X, Bell, Calendar, Info } from "lucide-react"

interface TaskFormProps {
  selectedDate: string
  selectedTime?: string
  onSubmit: (task: any) => void
  onClose: () => void
  dayStartTime?: number
}

export function TaskForm({ selectedDate, selectedTime, onSubmit, onClose, dayStartTime = 6 }: TaskFormProps) {
  const [title, setTitle] = useState("")
  const [time, setTime] = useState(selectedTime || "09:00")
  const [duration, setDuration] = useState(60)
  const [note, setNote] = useState("")
  const [reminder, setReminder] = useState(false)
  const [recurring, setRecurring] = useState<"none" | "daily" | "weekly" | "monthly">("none")
  const [isScheduled, setIsScheduled] = useState(!!selectedTime)

  // Determine if the selected time is for the next day
  const getActualDateForTime = (timeStr: string, baseDate: string) => {
    const [hours] = timeStr.split(":").map(Number)
    const date = new Date(baseDate)

    // If hour is before dayStartTime, it belongs to the next day
    if (hours < dayStartTime) {
      date.setDate(date.getDate() + 1)
    }

    return date.toISOString().split("T")[0]
  }

  const isNextDay = selectedTime ? Number.parseInt(selectedTime.split(":")[0]) < dayStartTime : false

  const actualTaskDate = isScheduled ? getActualDateForTime(time, selectedDate) : selectedDate

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    // Always send isAllDay and date for unscheduled tasks
    let taskData: any = {
      title: title.trim(),
      note: note.trim(),
      reminder,
      isScheduled,
    }

    if (isScheduled) {
      // Scheduled: send isAllDay: false, date, dateTime, and endDateTime
      const dateTimeISO = `${actualTaskDate}T${time}:00`;
      // Calculate end time
      const [hour, minute] = time.split(":").map(Number);
      const startDateObj = new Date(`${actualTaskDate}T${time}:00`);
      const endDateObj = new Date(startDateObj.getTime() + duration * 60000);
      const endDateTimeISO = endDateObj.toISOString().slice(0,16);
      Object.assign(taskData, {
        isAllDay: false,
        date: actualTaskDate,
        dateTime: dateTimeISO,
        endDateTime: endDateTimeISO,
        duration,
        recurring: recurring !== "none" ? { type: recurring } : undefined,
      })
    } else {
      // Unscheduled: treat as all-day event for Google Calendar
      const today = new Date().toISOString().split("T")[0];
      Object.assign(taskData, {
        isAllDay: true,
        date: today,
      })
    }

    onSubmit(taskData)

    // Reset form
    setTitle("")
    setTime("09:00")
    setDuration(60)
    setNote("")
    setReminder(false)
    setRecurring("none")
    setIsScheduled(false)
    onClose()
  }

  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="form-card rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold greeting-text">Add Task</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title" className="input-label">
              Task Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              required
            />
          </div>

          {/* Schedule Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="scheduled" className="flex items-center gap-2 input-label">
              <Calendar className="h-4 w-4" />
              Schedule this task
            </Label>
            <Switch id="scheduled" checked={isScheduled} onCheckedChange={setIsScheduled} />
          </div>

          {/* Scheduled Task Fields */}
          {isScheduled && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date" className="input-label">
                    Date
                  </Label>
                  <Input id="date" type="date" value={actualTaskDate} readOnly className="bg-muted" />
                  {isNextDay && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-blue-600 dark:text-blue-400">
                      <Info className="h-3 w-3" />
                      <span>This time is for the next day</span>
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="time" className="input-label">
                    Time
                  </Label>
                  <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                </div>
              </div>

              {/* Date display helper */}
              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                <div className="text-sm">
                  <span className="font-medium">Task will be scheduled for:</span>
                  <br />
                  <span className="text-blue-700 dark:text-blue-300">
                    {formatDateDisplay(actualTaskDate)} at {time}
                  </span>
                </div>
              </div>

              <div>
                <Label htmlFor="duration" className="input-label">
                  Duration (minutes)
                </Label>
                <Select value={duration.toString()} onValueChange={(value) => setDuration(Number.parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="180">3 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="recurring" className="input-label">
                  Recurring
                </Label>
                <Select value={recurring} onValueChange={(value: any) => setRecurring(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No repeat</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div>
            <Label htmlFor="note" className="input-label">
              Note
            </Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note (optional)"
              rows={3}
            />
          </div>

          {isScheduled && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="reminder"
                checked={reminder}
                onCheckedChange={(checked) => setReminder(checked as boolean)}
              />
              <Label htmlFor="reminder" className="flex items-center gap-2 input-label">
                <Bell className="h-4 w-4" />
                Set reminder
              </Label>
            </div>
          )}

          <Button type="submit" className="w-full bg-accent-color hover:bg-accent-color-hover text-white">
            {isScheduled ? "Schedule Task" : "Add to List"}
          </Button>
        </form>
      </div>
    </div>
  )
}
