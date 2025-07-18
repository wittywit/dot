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
import { useGoogleAuth } from "./GoogleAuthContext";

interface SettingsMenuProps {
  onClose: () => void;
  localOnlyCount?: number;
  onSyncLocalTasks?: () => void;
}

const accentColors: { value: AccentColor; name: string; color: string }[] = [
  { value: "yellow", name: "Yellow", color: "hsl(45, 100%, 51%)" },
  { value: "blue", name: "Blue", color: "hsl(217, 91%, 60%)" },
  { value: "green", name: "Green", color: "hsl(142, 76%, 36%)" },
  { value: "purple", name: "Purple", color: "hsl(262, 83%, 58%)" },
  { value: "red", name: "Red", color: "hsl(0, 84%, 60%)" },
  { value: "orange", name: "Orange", color: "hsl(25, 95%, 53%)" },
]

export function SettingsMenu({ onClose, localOnlyCount, onSyncLocalTasks }: SettingsMenuProps) {
  const { settings, updateSettings } = useSettings()
  const { requestPermission, showNotification } = useNotifications([], true)
  const [tempName, setTempName] = useState(settings.name)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default")
  const { isSignedIn, user, loading, signIn, signOut, refresh } = useGoogleAuth();

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
            {isSignedIn && user ? (
              <Input
                id="name"
                value={user.name}
                readOnly
                className="bg-muted cursor-not-allowed"
              />
            ) : (
              <Input
                id="name"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                placeholder="Enter your name"
              />
            )}
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
          <div className="text-center p-3">
            {loading && <div>Loading Google Calendar integration...</div>}
            {!loading && !isSignedIn && (
              <Button onClick={signIn} className="w-full bg-accent-color hover:bg-accent-color-hover text-white text-lg py-3 rounded-lg flex items-center justify-center gap-2">
                <span>Sign in with Google</span>
                <svg width="18" height="18" viewBox="0 0 48 48" className="inline-block"><g><path fill="#4285F4" d="M43.6 20.5H42V20H24v8h11.3C34.7 32.1 30.1 35 24 35c-6.1 0-11.3-4.1-13.1-9.6-0.4-1-0.6-2-0.6-3.1s0.2-2.1 0.6-3.1C12.7 15.1 17.9 11 24 11c3.1 0 6 1.1 8.2 2.9l6.2-6.2C34.5 4.5 29.5 2 24 2 12.9 2 7.6 7.6 6.3 14.7z"/><path fill="#34A853" d="M6.3 14.7l6.6 4.8C14.3 16.1 18.8 13 24 13c3.1 0 6 1.1 8.2 2.9l6.2-6.2C34.5 4.5 29.5 2 24 2 15.1 2 7.6 7.6 6.3 14.7z"/><path fill="#FBBC05" d="M24 44c5.5 0 10.5-2.1 14.3-5.7l-6.6-5.4C29.9 34.9 27.1 36 24 36c-6.1 0-11.3-4.1-13.1-9.6l-6.6 5.1C7.6 40.4 15.1 44 24 44z"/><path fill="#EA4335" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-4.1 5.5-7.3 5.5-4.1 0-7.5-3.4-7.5-7.5s3.4-7.5 7.5-7.5c1.7 0 3.2 0.6 4.4 1.6l6.2-6.2C34.5 4.5 29.5 2 24 2 12.9 2 4 10.9 4 22s8.9 20 20 20c11.1 0 20-8.9 20-20 0-1.3-0.1-2.7-0.4-4z"/></g></svg>
              </Button>
            )}
            {!loading && isSignedIn && user && (
              <div className="flex items-center justify-center gap-3 flex-wrap mb-3">
                {user.imageUrl && <img src={user.imageUrl} alt={user.name} className="w-8 h-8 rounded-full" />}
                <div className="text-left">
                  <div className="font-semibold">{user.name}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                  <div className="text-xs text-green-700 dark:text-green-400 mt-1">Signed in with Google</div>
                </div>
              </div>
            )}
            {/* Sync all local tasks button */}
            {!loading && isSignedIn && localOnlyCount && localOnlyCount > 0 && onSyncLocalTasks && (
              <Button onClick={onSyncLocalTasks} className="w-full bg-muted text-accent-color border border-accent-color hover:bg-accent-color hover:text-white text-base py-2 rounded-lg transition-all duration-150">
                <span>Sync all local tasks to Google Calendar</span>
              </Button>
            )}
            {!loading && isSignedIn && (
              <div className="flex flex-col gap-2 mt-2">
                <Button onClick={signOut} variant="outline" className="w-full text-base py-2 rounded-lg">Sign out</Button>
                <Button onClick={refresh} className="w-full bg-accent-color hover:bg-accent-color-hover text-white text-base py-2 rounded-lg">Refresh Events</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
