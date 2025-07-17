"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { X, User, Clock, Bell, Moon, Palette, CheckCircle } from "lucide-react"
import { useSettings } from "../hooks/use-settings"
import { useNotifications } from "../hooks/use-notifications"
import type { AccentColor } from "../types/task"
import GoogleCalendarSync from "./GoogleCalendarSync"

interface SettingsMenuProps {
  onClose: () => void
}

const accentColors: { value: AccentColor; name: string; color: string }[] = [
  { value: "yellow", name: "Yellow", color: "hsl(45, 100%, 51%)" },
  { value: "blue", name: "Blue", color: "hsl(217, 91%, 60%)" },
  { value: "green", name: "Green", color: "hsl(142, 76%, 36%)" },
  { value: "purple", name: "Purple", color: "hsl(262, 83%, 58%)" },
  { value: "red", name: "Red", color: "hsl(0, 84%, 60%)" },
  { value: "orange", name: "Orange", color: "hsl(25, 95%, 53%)" },
]

export function SettingsMenu({ onClose }: SettingsMenuProps) {
  const { settings, updateSettings } = useSettings()
  const { requestPermission, showNotification } = useNotifications([], true)
  const [tempName, setTempName] = useState(settings.name)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default")

  const handleSave = () => {
    updateSettings({ name: tempName })

    // Apply dark mode immediately
    if (settings.darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }

    // Apply accent color immediately
    document.documentElement.classList.remove(
      "accent-yellow",
      "accent-blue",
      "accent-green",
      "accent-purple",
      "accent-red",
      "accent-orange",
    )
    document.documentElement.classList.add(`accent-${settings.accentColor}`)

    // Show success notification
    showNotification("⚙️ Settings Saved!", {
      body: "Your preferences have been updated successfully",
    })

    // Force a re-render by triggering a state update in the parent
    onClose()

    // Small delay to ensure settings are saved before any other operations
    setTimeout(() => {
      window.dispatchEvent(new Event("settings-updated"))
    }, 100)
  }

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestPermission()
      if (granted) {
        updateSettings({ notifications: true })
        showNotification("🔔 Notifications Enabled!", {
          body: "You'll now receive reminders and updates",
        })
      } else {
        // If permission denied, keep notifications off
        updateSettings({ notifications: false })
      }
    } else {
      updateSettings({ notifications: false })
    }
  }

  const testNotification = () => {
    showNotification("🧪 Test Notification", {
      body: "This is how your notifications will look!",
    })
  }

  const hours = Array.from({ length: 24 }, (_, i) => {
    const hour = i
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    const ampm = hour >= 12 ? "PM" : "AM"
    return {
      value: hour,
      label: `${displayHour}:00 ${ampm}`,
    }
  })

  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }

    // Apply accent color
    document.documentElement.classList.remove(
      "accent-yellow",
      "accent-blue",
      "accent-green",
      "accent-purple",
      "accent-red",
      "accent-orange",
    )
    document.documentElement.classList.add(`accent-${settings.accentColor}`)
  }, [settings.darkMode, settings.accentColor])

  useEffect(() => {
    // Check current notification permission
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission)
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="settings-card rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold greeting-text">Settings</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-6">
          {/* User Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2 input-label">
              <User className="h-4 w-4" />
              Your Name
            </Label>
            <Input
              id="name"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>

          {/* Day Start Time */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 input-label">
              <Clock className="h-4 w-4" />
              Day Starts At
            </Label>
            <Select
              value={settings.dayStartTime.toString()}
              onValueChange={(value) => updateSettings({ dayStartTime: Number.parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {hours.map((hour) => (
                  <SelectItem key={hour.value} value={hour.value.toString()}>
                    {hour.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Accent Color */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 input-label">
              <Palette className="h-4 w-4" />
              Accent Color
            </Label>
            <div className="grid grid-cols-6 gap-3">
              {accentColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => updateSettings({ accentColor: color.value })}
                  className={`color-option ${settings.accentColor === color.value ? "selected" : ""}`}
                  style={{ backgroundColor: color.color }}
                  title={color.name}
                />
              ))}
            </div>
            <p className="text-sm task-details">
              Current: {accentColors.find((c) => c.value === settings.accentColor)?.name}
            </p>
          </div>

          {/* Dark Mode */}
          <div className="flex items-center justify-between">
            <Label htmlFor="darkMode" className="flex items-center gap-2 input-label">
              <Moon className="h-4 w-4" />
              Dark Mode
            </Label>
            <Switch
              id="darkMode"
              checked={settings.darkMode}
              onCheckedChange={(checked) => updateSettings({ darkMode: checked })}
            />
          </div>

          {/* Notifications */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications" className="flex items-center gap-2 input-label">
                <Bell className="h-4 w-4" />
                Enable Notifications
              </Label>
              <Switch id="notifications" checked={settings.notifications} onCheckedChange={handleNotificationToggle} />
            </div>

            {settings.notifications && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm task-details">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>
                    Permission:{" "}
                    {notificationPermission === "granted"
                      ? "Granted"
                      : notificationPermission === "denied"
                        ? "Denied"
                        : "Not requested"}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testNotification}
                  className="w-full bg-transparent"
                  disabled={notificationPermission !== "granted"}
                >
                  Test Notification
                </Button>
                <p className="text-xs task-details">
                  Get reminders for tasks, completion notifications, and upcoming task alerts
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button className="w-full" onClick={handleSave}>
            Save
          </Button>
          <Button className="w-full" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>

        {/* Account Section */}
        <div className="mt-8 pt-6 border-t">
          <h3 className="text-lg font-semibold mb-2">Account</h3>
          <GoogleCalendarSync onRefresh={() => {/* No reload here, rely on event */}} />
        </div>
      </div>
    </div>
  )
}
