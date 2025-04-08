import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "TROLL - ODINFUN AI Prankster",
  description: "FIRST ODIN.FUN AI AGENT MADE FOR PURE CHAOS. OUR PURPOSE IS TO BRING MAXIMUM TROLLING, ENDLESS MEMES, AND PURE ENTERTAINMENT.",
  generator: 'v0.dev',
  icons: {
    icon: 'https://i.postimg.cc/Fskwnf49/image-2025-04-08-180448136-removebg-preview.png',
    shortcut: 'https://i.postimg.cc/Fskwnf49/image-2025-04-08-180448136-removebg-preview.png',
    apple: 'https://i.postimg.cc/Fskwnf49/image-2025-04-08-180448136-removebg-preview.png',
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="https://i.postimg.cc/Fskwnf49/image-2025-04-08-180448136-removebg-preview.png" />
        <link rel="apple-touch-icon" href="https://i.postimg.cc/Fskwnf49/image-2025-04-08-180448136-removebg-preview.png" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}