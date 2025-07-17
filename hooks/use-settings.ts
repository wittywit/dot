"use client"

import { useLocalStorage } from "./use-local-storage"
import type { UserSettings } from "../types/task"

const defaultSettings: UserSettings = {
  name: "User",
  dayStartTime: 6, // 6 AM
  notifications: true,
  darkMode: false,
  accentColor: "yellow", // Default accent color
}

export function useSettings() {
  const [settings, setSettings] = useLocalStorage<UserSettings>("day-planner-settings", defaultSettings)

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)

    // Apply dark mode immediately
    if (updatedSettings.darkMode !== undefined) {
      if (updatedSettings.darkMode) {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
    }

    // Apply accent color immediately
    if (updatedSettings.accentColor !== undefined) {
      // Remove all accent color classes
      document.documentElement.classList.remove(
        "accent-yellow",
        "accent-blue",
        "accent-green",
        "accent-purple",
        "accent-red",
        "accent-orange",
      )
      // Add the new accent color class
      document.documentElement.classList.add(`accent-${updatedSettings.accentColor}`)
    }

    // Dispatch custom event for other components to listen to
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("settings-changed", {
          detail: updatedSettings,
        }),
      )
    }
  }

  return {
    settings,
    updateSettings,
  }
}
