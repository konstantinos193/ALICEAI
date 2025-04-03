import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Syn - ODINFUN AI Agent",
  description: "First BTC AI agent made by Grok 3 Technology",
  generator: 'v0.dev',
  icons: {
    icon: 'https://i.postimg.cc/mg2XMBs4/logo-removebg-preview-1.png',
    shortcut: 'https://i.postimg.cc/mg2XMBs4/logo-removebg-preview-1.png',
    apple: 'https://i.postimg.cc/mg2XMBs4/logo-removebg-preview-1.png',
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
        <link rel="icon" href="https://i.postimg.cc/mg2XMBs4/logo-removebg-preview-1.png" />
        <link rel="apple-touch-icon" href="https://i.postimg.cc/mg2XMBs4/logo-removebg-preview-1.png" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}