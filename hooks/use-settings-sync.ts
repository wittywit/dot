"use client"

import { useEffect } from "react"
import { useSettings } from "./use-settings"

export function useSettingsSync() {
  const { settings } = useSettings()

  useEffect(() => {
    // Apply dark mode immediately when settings change
    if (settings.darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [settings.darkMode])

  useEffect(() => {
    // Apply any other immediate settings changes here
    // This hook ensures settings are applied across the app
  }, [settings])

  return settings
}
