"use client"

import { useEffect } from "react"
import { useSettings } from "./use-settings"

export function useDarkMode() {
  const { settings, updateSettings } = useSettings()

  useEffect(() => {
    // Apply dark mode class immediately
    const applyDarkMode = () => {
      if (settings.darkMode) {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
    }

    applyDarkMode()

    // Listen for settings changes
    const handleSettingsChange = (event: CustomEvent) => {
      if (event.detail.darkMode !== undefined) {
        applyDarkMode()
      }
    }

    window.addEventListener("settings-changed", handleSettingsChange as EventListener)

    return () => {
      window.removeEventListener("settings-changed", handleSettingsChange as EventListener)
    }
  }, [settings.darkMode])

  const toggleDarkMode = () => {
    const newDarkMode = !settings.darkMode
    updateSettings({ darkMode: newDarkMode })
  }

  return {
    isDarkMode: settings.darkMode,
    toggleDarkMode,
  }
}
