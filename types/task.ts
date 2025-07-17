export interface Task {
  id: string
  title: string
  date?: string // Make optional for unscheduled tasks
  time?: string // Make optional for unscheduled tasks
  duration?: number // Make optional for unscheduled tasks
  note?: string
  completed: boolean
  recurring?: {
    type: "daily" | "weekly" | "monthly"
    endDate?: string
  }
  reminder?: boolean
  isScheduled: boolean // New field to track if task is scheduled
}

export type AccentColor = "yellow" | "blue" | "green" | "purple" | "red" | "orange"

export interface UserSettings {
  name: string
  dayStartTime: number // 0-23 (hour)
  notifications: boolean
  darkMode: boolean
  accentColor: AccentColor // New field for accent color
}

export interface TaskStats {
  totalTasks: number
  completedTasks: number
  completionRate: number
  streakDays: number
  todayTasks: number
  todayCompleted: number
  unscheduledTasks: number // New field for unscheduled tasks
}
