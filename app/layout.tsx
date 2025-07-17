import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import InstallPrompt from "../components/InstallPrompt"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Day Planner",
  description: "A simple day planner with tasks and reminders",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <InstallPrompt />
        {children}
      </body>
    </html>
  )
}
