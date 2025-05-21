import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "OdinDev Assistant - AI-powered help for Odin.Fun developers",
  description:
    "Get instant answers to your Odin.Fun development questions with our AI-powered assistant. Learn about Runes protocol, Bitcoin integration, token creation, and trading.",
  generator: "v0.dev",
  icons: {
    icon: "/images/odin-logo.png",
    shortcut: "/images/odin-logo.png",
    apple: "/images/odin-logo.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/images/odin-logo.png" />
        <link rel="apple-touch-icon" href="/images/odin-logo.png" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
