import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import InstallPrompt from "../components/InstallPrompt"
import ServiceWorkerRegister from "../components/ServiceWorkerRegister"
import { GoogleAuthProvider } from "../components/GoogleAuthContext";

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Dot: Day Planner",
  description: "A simple day planner with tasks and reminders",
    generator: 'Studio Poetics'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/dot/manifest.webmanifest" />
        <script src="https://apis.google.com/js/api.js"></script>
      </head>
      <body className={inter.className}>
        <GoogleAuthProvider>
          <InstallPrompt />
          <ServiceWorkerRegister />
          {children}
        </GoogleAuthProvider>
      </body>
    </html>
  )
}
