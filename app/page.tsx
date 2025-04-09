"use client"

import Image from "next/image"
import { useState, useEffect, useRef, FormEvent } from "react"
import { Mic, Plus, Send } from "lucide-react"

// Define message interface
interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const [inputMessage, setInputMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  // Wire animation effect
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Wire colors - exact colors from the reference
    const colors = [
      "#4285F4", // Blue
      "#34A853", // Green
      "#FFFFFF", // White
    ]

    // Create wires with specific patterns matching the reference
    const wires: {
      x: number
      y: number
      length: number
      speed: number
      color: string
      width: number
      curve: number
      direction: number
    }[] = []

    // Wire configurations from the current screenshot - horizontal straight lines
    const wireConfigs = [
      // Upper area
      { y: canvas.height * 0.15, color: "#FFFFFF", direction: -1, speed: 0.08, width: 1.0 },
      { y: canvas.height * 0.2, color: "#4285F4", direction: 1, speed: 0.12, width: 1.1 },
      { y: canvas.height * 0.25, color: "#FFFFFF", direction: -1, speed: 0.09, width: 1.0 },
      { y: canvas.height * 0.29, color: "#4285F4", direction: 1, speed: 0.10, width: 1.2 },
      
      // Middle area (near SYN's head)
      { y: canvas.height * 0.34, color: "#34A853", direction: 1, speed: 0.07, width: 1.0 },
      { y: canvas.height * 0.39, color: "#4285F4", direction: 1, speed: 0.11, width: 1.0 },
      { y: canvas.height * 0.44, color: "#FFFFFF", direction: -1, speed: 0.08, width: 1.0 },
      
      // Position around SYN text
      { y: canvas.height * 0.49, color: "#FFFFFF", direction: -1, speed: 0.10, width: 1.0 },
      { y: canvas.height * 0.56, color: "#4285F4", direction: 1, speed: 0.09, width: 1.1 },
      
      // Lower area
      { y: canvas.height * 0.63, color: "#34A853", direction: -1, speed: 0.08, width: 1.0 },
      { y: canvas.height * 0.68, color: "#4285F4", direction: 1, speed: 0.10, width: 1.2 },
      { y: canvas.height * 0.72, color: "#FFFFFF", direction: -1, speed: 0.09, width: 1.0 },
      { y: canvas.height * 0.77, color: "#4285F4", direction: 1, speed: 0.07, width: 1.1 },
      { y: canvas.height * 0.83, color: "#FFFFFF", direction: -1, speed: 0.11, width: 1.0 },
      { y: canvas.height * 0.9, color: "#FFFFFF", direction: 1, speed: 0.08, width: 1.0 },
    ]

    // Create wires based on the specific configurations to match the screenshot
    wireConfigs.forEach(config => {
      const direction = config.direction
      const startX = direction === 1 
        ? -Math.random() * 100 - 800
        : canvas.width + Math.random() * 100

      wires.push({
        x: startX,
        y: config.y + (Math.random() * 3 - 1.5), // Very slight variation in y position
        length: Math.random() * 600 + 1000, // Longer wires to span the screen
        speed: config.speed * direction, // Very slow to match screenshot
        color: config.color,
        width: config.width, // Uniform width
        curve: Math.random() * 3 - 1.5, // Almost no curve - straight lines
        direction
      })
    })

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw wires
      for (const wire of wires) {
        ctx.beginPath()
        ctx.strokeStyle = wire.color
        ctx.lineWidth = wire.width

        // Create almost perfectly straight wires as in the screenshot
        ctx.moveTo(wire.x, wire.y)
        ctx.lineTo(wire.x + wire.length, wire.y) // Use lineTo for straight lines instead of bezier

        ctx.stroke()

        // Move wire
        wire.x += wire.speed

        // Reset wire position when it goes off screen
        if ((wire.direction === 1 && wire.x > canvas.width + 200) || 
            (wire.direction === -1 && wire.x < -wire.length - 200)) {
          wire.x = wire.direction === 1 ? -wire.length - 100 : canvas.width + 100
          
          // Keep almost the exact same y position with minimal variation
          wire.y = wire.y + (Math.random() * 2 - 1)
        }
      }

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [])

  // Handle sending message
  const handleSendMessage = async (e?: FormEvent) => {
    e?.preventDefault()
    
    if (!inputMessage.trim()) return
    
    const userMessage: Message = {
      role: "user",
      content: inputMessage
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)
    
    try {
      // Call GPT API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage]
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to get response')
      }
      
      const data = await response.json()
      
      setMessages(prev => [
        ...prev, 
        { role: "assistant", content: data.message }
      ])
    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => [
        ...prev, 
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center relative overflow-hidden bg-black">
      {/* Background wires canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />

      {/* Interface with rounded corners - exact match to the current screenshot */}
      <div className="relative z-10 w-full max-w-[1200px] mx-auto h-screen">
        {/* Buy Troll Button */}
        <div className="absolute top-6 right-6 z-30">
          <button 
            onClick={() => window.open('https://odin.fun/token/2ezs', '_blank')}
            className="bg-gradient-to-r from-blue-600/100 to-purple-600/100 text-white font-bold py-3 px-8 rounded-full shadow-lg uppercase text-sm tracking-wider hover:scale-105 transition-all duration-200"
          >
            Buy Troll
          </button>
        </div>
        
        <div className="absolute inset-x-5 inset-y-5 rounded-[40px] border border-white/10 overflow-hidden z-0">
          {/* This creates the rounded container visible in the image */}
        </div>

        {/* X1 Logo - positioned at the top center */}
        <div className="absolute top-[330px] left-1/2 -translate-x-1/2 z-10">
          <div className="bg-black rounded-lg p-1.5 mb-2 border border-gray-700 flex items-center justify-center w-10 h-10">
            <Image
              src="/images/x1-logo.webp"
              alt="X1 Logo"
              width={20}
              height={20}
              priority
              className="object-contain"
            />
          </div>
        </div>

        {/* Syn Title - positioned at the center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center text-center">
          <h1 className="text-white text-9xl font-bold tracking-tighter">TROLL</h1>

          {/* Description text - smaller and more condensed as in the screenshot */}
          <p className="text-white text-center uppercase tracking-wide text-[8px] font-medium leading-tight max-w-[250px] mt-1">
            FIRST ODIN.FUN AI AGENT MADE FOR PURE CHAOS.<br/>
            OUR PURPOSE IS TO BRING MAXIMUM TROLLING,<br/>
            ENDLESS MEMES, AND PURE ENTERTAINMENT.
          </p>
        </div>

        {/* Character image positioned further right and bigger */}
        <div className="absolute right-[-10%] bottom-0 h-[95vh] z-10">
          <Image
            src="https://i.postimg.cc/Fskwnf49/image-2025-04-08-180448136-removebg-preview.png"
            alt="Syn AI Character"
            width={700}
            height={900}
            priority
            className="object-contain h-full character-image"
          />
        </div>

        {/* IMPROVED CHAT INTERFACE - With fixed height and better styling */}
        <div className="absolute left-2 w-[330px] top-[80px] bg-black/90 backdrop-blur-xl rounded-xl border border-white/20 overflow-hidden z-20 shadow-2xl flex flex-col h-[620px]">
          {/* Chat header */}
          <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 px-5 py-3 border-b border-white/20 flex items-center">
            <h3 className="text-white font-medium text-sm">TROLL - Master of Mischief ( ͡° ͜ʖ ͡°)</h3>
          </div>
          
          {/* Chat messages area - fixed height */}
          <div 
            ref={chatContainerRef}
            className="flex-1 p-4 overflow-y-auto h-[520px] scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent relative"
          >
            {messages.length === 0 ? (
              <p className="text-white/70 text-sm italic">Problem? ( ͡° ͜ʖ ͡°) I'm TROLL, and I'm here to make your day... interesting. Ask me anything! 🎭</p>
            ) : (
              messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`${
                    msg.role === "user" 
                      ? "bg-blue-600/30 border-l-4 border-blue-500 ml-2" 
                      : "bg-purple-600/30 border-l-4 border-purple-500 mr-2"
                  } p-3 rounded-lg shadow-md mb-3 break-words`}
                >
                  {msg.role === "user" && <div className="text-xs text-blue-300/70 mb-1 font-medium">You</div>}
                  {msg.role === "assistant" && <div className="text-xs text-purple-300/70 mb-1 font-medium">TROLL</div>}
                  <p className="text-white leading-relaxed text-sm">{msg.content}</p>
                </div>
              ))
            )}
            {isLoading && (
              <div className="bg-purple-600/30 border-l-4 border-purple-500 mr-2 p-3 rounded-lg shadow-md flex items-center space-x-2">
                <div className="animate-spin h-4 w-4 border-2 border-purple-500 rounded-full border-t-transparent"></div>
                <p className="text-white text-sm">Processing...</p>
              </div>
            )}
            
            {/* Scroll to bottom button - appears when scrolled up */}
            {messages.length > 1 && (
              <button 
                onClick={() => chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' })}
                className="absolute bottom-2 right-2 bg-blue-900/50 hover:bg-blue-800/60 p-2 rounded-full shadow-md transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
            )}
          </div>
          
          {/* Chat input area */}
          <div className="p-3 border-t border-white/10 bg-black/70">
            <form 
              onSubmit={handleSendMessage}
              className="relative flex items-center"
            >
              <inputhttps://odin.fun/token/2ezs
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="ASK ME SOMETHING... IF YOU DARE 😈"
                className="rounded-full border border-white/20 bg-black/80 h-[45px] w-full pl-10 pr-10 text-white text-xs uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-md transition-all duration-200"
              />
              <button 
                type="button" 
                className="absolute left-3 hover:text-white/90 transition-colors"
              >
                <Plus size={18} className="text-white/60" />
              </button>
              <button 
                type="submit"
                className="absolute right-3 transition-all hover:scale-110"
              >
                {inputMessage.trim() ? (
                  <Send size={18} className="text-blue-400 hover:text-blue-300 transition-colors" />
                ) : (
                  <Mic size={18} className="text-white/60 hover:text-white/90 transition-colors" />
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}

