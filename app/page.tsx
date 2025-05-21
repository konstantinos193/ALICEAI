"use client"

import React from "react"
import Image from "next/image"
import { useState, useEffect, useRef, type FormEvent } from "react"
import { Send, Code, Copy, Check, Terminal, Menu, X } from "lucide-react"

// Define message interface
interface Message {
  role: "user" | "assistant"
  content: string
}

// Simple syntax highlighter function
function highlightCode(code: string, language: string): string {
  // Define patterns for different syntax elements
  const patterns: Record<string, { pattern: RegExp; className: string }> = {
    // Comments
    comment: {
      pattern: /\/\/.*?$|\/\*[\s\S]*?\*\/|#.*?$/gm,
      className: "comment",
    },
    // Strings
    string: {
      pattern: /(["'`])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/g,
      className: "string",
    },
    // Numbers
    number: {
      pattern: /\b0x[\da-f]+\b|(?:\b\d+\.?\d*|\B\.\d+)(?:e[+-]?\d+)?/gi,
      className: "number",
    },
    // Keywords
    keyword: {
      pattern:
        /\b(async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/g,
      className: "keyword",
    },
    // Functions
    function: {
      pattern: /\b[A-Za-z_$][\w$]*(?=\s*\()/g,
      className: "function",
    },
    // Operators
    operator: {
      pattern: /[<>]=?|[!=]=?=?|--?|\+\+?|&&?|\|\|?|[?*/~^%]/g,
      className: "operator",
    },
    // Punctuation
    punctuation: {
      pattern: /[{}[\];(),.:]/g,
      className: "punctuation",
    },
  }

  // Special handling for JSX/HTML in React code
  if (language === "jsx" || language === "tsx" || language === "html") {
    patterns["tag"] = {
      pattern: /<\/?(?!\d)[^\s>/=$<%]+(?:\s+[^\s>/=]+(?:=(?:("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|[^\s'">=]+))?)*\s*\/?>/gi,
      className: "tag",
    }
    patterns["attr-name"] = {
      pattern: /\s[^\s>/=]+(?:=(?:("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|[^\s'">=]+))?/gi,
      className: "attr-name",
    }
  }

  // Apply highlighting
  let highlightedCode = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")

  // Apply patterns
  Object.entries(patterns).forEach(([type, { pattern, className }]) => {
    highlightedCode = highlightedCode.replace(pattern, (match) => {
      return `<span class="${className}">${match}</span>`
    })
  })

  return highlightedCode
}

export default function Home() {
  const [inputMessage, setInputMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  // Reset copied state after 2 seconds
  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => {
        setCopied(null)
      }, 2000)
      return () => clearTimeout(timeout)
    }
  }, [copied])

  // Handle sending message
  const handleSendMessage = async (e?: FormEvent) => {
    e?.preventDefault()

    if (!inputMessage.trim()) return

    const userMessage: Message = {
      role: "user",
      content: inputMessage,
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    try {
      // Call API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("API Error:", data.error || "Unknown error")
        throw new Error(data.error || "Failed to get response")
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.message }])
    } catch (error) {
      console.error("Error:", error)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again later.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // Function to copy code to clipboard
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
  }

  // Function to format message content with code blocks
  const formatMessageContent = (content: string, messageId: number) => {
    // Regular expression to match code blocks with language specification
    const codeBlockRegex = /```([a-zA-Z0-9_]+)?\n([\s\S]*?)```/g

    const parts = []
    let lastIndex = 0
    let match
    let codeBlockId = 0

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push(
          <div key={`text-${messageId}-${lastIndex}`} className="prose prose-invert max-w-none mb-4">
            {content
              .slice(lastIndex, match.index)
              .split("\n\n")
              .map((paragraph, i) => {
                // Handle lists
                if (paragraph.match(/^[*-]\s/m)) {
                  return (
                    <ul key={i} className="list-disc pl-6 my-2">
                      {paragraph.split(/\n/).map((item, j) => (
                        <li key={j} className="mb-1">
                          {item.replace(/^[*-]\s/, "")}
                        </li>
                      ))}
                    </ul>
                  )
                }

                // Handle headings
                if (paragraph.startsWith("# ")) {
                  return (
                    <h2 key={i} className="text-xl font-bold mt-4 mb-2">
                      {paragraph.replace(/^# /, "")}
                    </h2>
                  )
                }
                if (paragraph.startsWith("## ")) {
                  return (
                    <h3 key={i} className="text-lg font-bold mt-3 mb-2">
                      {paragraph.replace(/^## /, "")}
                    </h3>
                  )
                }

                // Regular paragraphs
                return paragraph ? (
                  <p key={i} className="mb-3 whitespace-pre-wrap">
                    {paragraph}
                  </p>
                ) : null
              })}
          </div>,
        )
      }

      // Add code block with syntax highlighting
      const language = match[1] || "javascript"
      const code = match[2].trim()
      const blockId = `code-${messageId}-${codeBlockId}`
      const highlightedCode = highlightCode(code, language)

      parts.push(
        <div key={blockId} className="relative mb-4 rounded-md overflow-hidden">
          <div className="flex items-center justify-between bg-gray-800 px-2 sm:px-4 py-1.5 text-xs text-gray-200">
            <span>{language}</span>
            <button
              onClick={() => copyToClipboard(code, blockId)}
              className="hover:text-white transition-colors"
              aria-label="Copy code"
            >
              {copied === blockId ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
          <pre className="bg-gray-900 p-2 sm:p-4 overflow-x-auto rounded-b-md text-xs sm:text-sm">
            <code className="syntax-highlight" dangerouslySetInnerHTML={{ __html: highlightedCode }} />
          </pre>
        </div>,
      )

      lastIndex = match.index + match[0].length
      codeBlockId++
    }

    // Add remaining text after last code block
    if (lastIndex < content.length) {
      parts.push(
        <div key={`text-${messageId}-${lastIndex}`} className="prose prose-invert max-w-none">
          {content
            .slice(lastIndex)
            .split("\n\n")
            .map((paragraph, i) => {
              // Handle lists
              if (paragraph.match(/^[*-]\s/m)) {
                return (
                  <ul key={i} className="list-disc pl-6 my-2">
                    {paragraph.split(/\n/).map((item, j) => (
                      <li key={j} className="mb-1">
                        {item.replace(/^[*-]\s/, "")}
                      </li>
                    ))}
                  </ul>
                )
              }

              // Handle headings
              if (paragraph.startsWith("# ")) {
                return (
                  <h2 key={i} className="text-xl font-bold mt-4 mb-2">
                    {paragraph.replace(/^# /, "")}
                  </h2>
                )
              }
              if (paragraph.startsWith("## ")) {
                return (
                  <h3 key={i} className="text-lg font-bold mt-3 mb-2">
                    {paragraph.replace(/^## /, "")}
                  </h3>
                )
              }

              // Regular paragraphs
              return paragraph ? (
                <p key={i} className="mb-3 whitespace-pre-wrap">
                  {paragraph}
                </p>
              ) : null
            })}
        </div>,
      )
    }

    return parts.length > 0 ? (
      parts
    ) : (
      <div className="prose prose-invert max-w-none">
        {content.split("\n\n").map((paragraph, i) => {
          // Handle lists
          if (paragraph.match(/^[*-]\s/m)) {
            return (
              <ul key={i} className="list-disc pl-6 my-2">
                {paragraph.split(/\n/).map((item, j) => (
                  <li key={j} className="mb-1">
                    {item.replace(/^[*-]\s/, "")}
                  </li>
                ))}
              </ul>
            )
          }

          // Handle headings
          if (paragraph.startsWith("# ")) {
            return (
              <h2 key={i} className="text-xl font-bold mt-4 mb-2">
                {paragraph.replace(/^# /, "")}
              </h2>
            )
          }
          if (paragraph.startsWith("## ")) {
            return (
              <h3 key={i} className="text-lg font-bold mt-3 mb-2">
                {paragraph.replace(/^## /, "")}
              </h3>
            )
          }

          // Regular paragraphs
          return paragraph ? (
            <p key={i} className="mb-3 whitespace-pre-wrap">
              {paragraph}
            </p>
          ) : null
        })}
      </div>
    )
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuOpen) {
        const target = event.target as HTMLElement
        const sidebar = document.querySelector(".mobile-sidebar")
        if (sidebar && !sidebar.contains(target) && !target.closest('button[aria-label="Toggle menu"]')) {
          setMobileMenuOpen(false)
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [mobileMenuOpen])

  return (
    <main className="flex min-h-screen flex-col bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950 py-4 px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden mr-2 text-gray-300 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-2 flex items-center justify-center">
            <Terminal size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold">OdinDev Assistant</h1>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://odin.fun"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-300 hover:text-white transition-colors text-sm flex items-center gap-2"
          >
            <Image src="/images/odin-logo.png" alt="Odin Logo" width={20} height={20} className="rounded-full" />
            <span className="hidden sm:inline">Odin.fun</span>
          </a>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Mobile version */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-gray-900/80 backdrop-blur-sm">
            <div className="fixed inset-y-0 left-0 w-3/4 max-w-xs bg-gray-950 p-4 overflow-y-auto mobile-sidebar">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Ask About</h2>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-gray-400 hover:text-white"
                  aria-label="Close menu"
                >
                  <X size={24} />
                </button>
              </div>
              <nav className="space-y-1">
                <button
                  onClick={() => {
                    setInputMessage("What is Odin.Fun and how does it work?")
                    setMobileMenuOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Platform Overview
                </button>
                <button
                  onClick={() => {
                    setInputMessage("How do I create a token on Odin.Fun?")
                    setMobileMenuOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-gray-300 hover:bg-gray-800 transition-colors"
                >
                  Token Creation
                </button>
                <button
                  onClick={() => {
                    setInputMessage("Explain the Runes protocol and how it works with Bitcoin")
                    setMobileMenuOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-gray-300 hover:bg-gray-800 transition-colors"
                >
                  Runes Protocol
                </button>
                <button
                  onClick={() => {
                    setInputMessage("How does Odin.Fun integrate with Bitcoin wallets?")
                    setMobileMenuOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-gray-300 hover:bg-gray-800 transition-colors"
                >
                  Wallet Integration
                </button>
                <button
                  onClick={() => {
                    setInputMessage("How does Odin.Fun achieve 2-second finality?")
                    setMobileMenuOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-gray-300 hover:bg-gray-800 transition-colors"
                >
                  Speed Architecture
                </button>
                <button
                  onClick={() => {
                    setInputMessage("What security measures does Odin.Fun implement?")
                    setMobileMenuOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-gray-300 hover:bg-gray-800 transition-colors"
                >
                  Security
                </button>
              </nav>

              <div className="mt-8">
                <h2 className="text-lg font-semibold mb-4">Resources</h2>
                <div className="space-y-2">
                  <a
                    href="https://odin.fun"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Official Website
                  </a>
                  <button
                    onClick={() => {
                      setInputMessage("What are the latest updates to Odin.Fun?")
                      setMobileMenuOpen(false)
                    }}
                    className="w-full text-left text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Latest Updates
                  </button>
                  <button
                    onClick={() => {
                      setInputMessage("What are some common issues when developing on Odin.Fun?")
                      setMobileMenuOpen(false)
                    }}
                    className="w-full text-left text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Troubleshooting
                  </button>
                  <button
                    onClick={() => {
                      setInputMessage("How can I get started with Odin.Fun development?")
                      setMobileMenuOpen(false)
                    }}
                    className="w-full text-left text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Getting Started
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sidebar */}
        <aside className="hidden md:block w-64 border-r border-gray-800 bg-gray-950 p-4">
          <h2 className="text-lg font-semibold mb-4">Ask About</h2>
          <nav className="space-y-1">
            <button
              onClick={() => setInputMessage("What is Odin.Fun and how does it work?")}
              className="w-full text-left px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Platform Overview
            </button>
            <button
              onClick={() => setInputMessage("How do I create a token on Odin.Fun?")}
              className="w-full text-left px-3 py-2 rounded-md text-gray-300 hover:bg-gray-800 transition-colors"
            >
              Token Creation
            </button>
            <button
              onClick={() => setInputMessage("Explain the Runes protocol and how it works with Bitcoin")}
              className="w-full text-left px-3 py-2 rounded-md text-gray-300 hover:bg-gray-800 transition-colors"
            >
              Runes Protocol
            </button>
            <button
              onClick={() => setInputMessage("How does Odin.Fun integrate with Bitcoin wallets?")}
              className="w-full text-left px-3 py-2 rounded-md text-gray-300 hover:bg-gray-800 transition-colors"
            >
              Wallet Integration
            </button>
            <button
              onClick={() => setInputMessage("How does Odin.Fun achieve 2-second finality?")}
              className="w-full text-left px-3 py-2 rounded-md text-gray-300 hover:bg-gray-800 transition-colors"
            >
              Speed Architecture
            </button>
            <button
              onClick={() => setInputMessage("What security measures does Odin.Fun implement?")}
              className="w-full text-left px-3 py-2 rounded-md text-gray-300 hover:bg-gray-800 transition-colors"
            >
              Security
            </button>
          </nav>

          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Resources</h2>
            <div className="space-y-2">
              <a
                href="https://odin.fun"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-gray-400 hover:text-white transition-colors"
              >
                Official Website
              </a>
              <button
                onClick={() => setInputMessage("What are the latest updates to Odin.Fun?")}
                className="w-full text-left text-sm text-gray-400 hover:text-white transition-colors"
              >
                Latest Updates
              </button>
              <button
                onClick={() => setInputMessage("What are some common issues when developing on Odin.Fun?")}
                className="w-full text-left text-sm text-gray-400 hover:text-white transition-colors"
              >
                Troubleshooting
              </button>
              <button
                onClick={() => setInputMessage("How can I get started with Odin.Fun development?")}
                className="w-full text-left text-sm text-gray-400 hover:text-white transition-colors"
              >
                Getting Started
              </button>
            </div>
          </div>
        </aside>

        {/* Chat area */}
        <div className="flex-1 flex flex-col max-h-screen">
          {/* Welcome banner */}
          {messages.length === 0 && (
            <div className="max-w-3xl mx-auto p-4 sm:p-6 mt-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-center">OdinDev Assistant</h2>
              <div className="bg-gray-800/50 rounded-lg p-4 sm:p-6 mb-6">
                <p className="text-gray-200 mb-4 text-center">
                  Ask me anything about Odin.Fun development, token creation, or Bitcoin integration.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    onClick={() => setInputMessage("How do I create a token on Odin.Fun?")}
                    className="bg-blue-600/20 hover:bg-blue-600/30 transition-colors rounded-md px-3 py-2 text-sm"
                  >
                    Create a token
                  </button>
                  <button
                    onClick={() => setInputMessage("How does Odin.Fun integrate with Bitcoin wallets?")}
                    className="bg-blue-600/20 hover:bg-blue-600/30 transition-colors rounded-md px-3 py-2 text-sm"
                  >
                    Wallet integration
                  </button>
                  <button
                    onClick={() => setInputMessage("Explain the Runes protocol")}
                    className="bg-blue-600/20 hover:bg-blue-600/30 transition-colors rounded-md px-3 py-2 text-sm"
                  >
                    Runes protocol
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Chat messages */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-4 sm:space-y-6">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`max-w-3xl mx-auto ${
                  msg.role === "user" ? "bg-blue-600/20" : "bg-gray-800/50"
                } p-3 sm:p-4 rounded-lg`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {msg.role === "user" ? (
                    <>
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600 flex items-center justify-center">
                        <span className="text-xs font-medium">You</span>
                      </div>
                      <span className="font-medium">You</span>
                    </>
                  ) : (
                    <>
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                        <Code size={16} />
                      </div>
                      <span className="font-medium">OdinDev Assistant</span>
                    </>
                  )}
                </div>
                <div className="ml-9 sm:ml-10">{formatMessageContent(msg.content, index)}</div>
              </div>
            ))}
            {isLoading && (
              <div className="max-w-3xl mx-auto bg-gray-800/50 p-3 sm:p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <Code size={16} />
                  </div>
                  <span className="font-medium">OdinDev Assistant</span>
                </div>
                <div className="ml-9 sm:ml-10 flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div
                      className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-400">Generating response...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="border-t border-gray-800 p-3 sm:p-4 bg-gray-950">
            <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto relative">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about Odin.Fun development..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 sm:py-3 pl-3 sm:pl-4 pr-10 sm:pr-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                disabled={isLoading}
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 transition-colors rounded-md p-1.5 sm:p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!inputMessage.trim() || isLoading}
              >
                <Send size={16} className="sm:size-18" />
              </button>
            </form>
            <p className="text-xs text-gray-500 mt-2 text-center px-2">
              OdinDev Assistant provides guidance based on available documentation. For official support, please refer
              to the Odin.Fun documentation.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
