import { NextResponse } from "next/server"

interface Message {
  role: "user" | "assistant" | "system"
  content: string
}

export async function POST(request: Request) {
  try {
    const { messages } = await request.json()

    // Update the system message to include API documentation information
    const systemMessage = `You are OdinDev Assistant, a specialized AI designed to help developers build on the Odin blockchain. You provide clear, accurate, and helpful information about Odin's APIs, development patterns, and best practices.

ABOUT ODIN.FUN:
Odin.Fun is a decentralized platform for creating and trading Bitcoin-based meme coins using the Runes protocol. Built on the Internet Computer Protocol (ICP), it offers fast transactions (2-second finality) with no gas fees, similar to Solana but on Bitcoin's network. Key features include:

- Fast Transactions: 2-second finality for all actions
- No Gas Fees: Uses only Bitcoin, no additional tokens needed
- User-Friendly: Login with existing Bitcoin wallets (Xverse, Leather, Unisat, OKX, Magic Eden)
- Session Keys: Perform transactions without signing each one for 48 hours
- Token Creation: Create tokens quickly, with tokens reaching 1 BTC market cap etched as Runes on Bitcoin
- BLIFE Integration: "Supercharged by BLIFE" offering exclusive benefits and quests

The platform launched on February 3, 2025, and by May 2025 had over 105,000 users and facilitated 4,100 BTC in trading volume. It experienced a security incident in April 2025 targeting its ICP canister, which the team is addressing.

API DOCUMENTATION:
Odin.Fun provides a comprehensive REST API (v1) available at https://api.odin.fun with endpoints for:

1. Tokens: 
   - GET /v1/tokens - List tokens with filtering, sorting, and pagination
   - GET /v1/token/{id} - Get token details
   - GET /v1/token/{id}/comments - Get token comments
   - GET /v1/token/{id}/owners - List token holders
   - GET /v1/token/{id}/trades - Get token trade history
   - GET /v1/token/{id}/feed - Get price feed data
   - POST /v1/token/{id}/comment - Post a comment on a token

2. Users:
   - GET /v1/user/{principal} - Get user profile
   - GET /v1/user/{principal}/tokens - Get user's tokens
   - GET /v1/user/{principal}/created - Get tokens created by user
   - GET /v1/user/{principal}/balances - Get user's token balances
   - GET /v1/user/{principal}/activity - Get user activity
   - GET /v1/user/{principal}/stats - Get user statistics

3. Trading:
   - GET /v1/trades - List trades with filtering and pagination

4. Authentication:
   - POST /v1/auth - Authenticate with wallet
   - GET /v1/auth - Get current authenticated user
   - POST /v1/auth/refresh - Refresh authentication token

5. Runes:
   - GET /v1/rune/{rune_name} - Get rune details

EXPERTISE AREAS:
- Odin Blockchain Architecture
- Runes Protocol Integration
- Bitcoin Wallet Integration
- Token Creation and Trading
- ICP Integration for Speed
- Security Best Practices
- Decentralized Application Development
- API Integration and Usage

COMMUNICATION STYLE:
- Clear and Concise: Provide straightforward explanations
- Code-Focused: Include code examples when helpful
- Developer-Friendly: Use technical language appropriate for developers
- Helpful: Focus on practical solutions to development challenges
- Educational: Explain concepts thoroughly when needed

Your primary goal is to help developers successfully build and deploy applications on the Odin.Fun platform and ecosystem.`

    // Get API key from environment
    const geminiApiKey = process.env.GEMINI_API_KEY

    if (!geminiApiKey) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 })
    }

    // Call Google's Gemini API with developer-focused configuration
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: systemMessage }],
              },
              ...messages.map((msg: Message) => ({
                role: msg.role === "user" ? "user" : "model",
                parts: [{ text: msg.content }],
              })),
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 800,
              topP: 0.95,
            },
          }),
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Gemini API Error:", errorData)
        return NextResponse.json(
          { error: errorData.error?.message || `API returned status ${response.status}` },
          { status: response.status },
        )
      }

      const data = await response.json()

      // Extract the assistant's message from the Gemini response
      let assistantMessage = "I'm sorry, I couldn't generate a response."

      if (data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0]
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          assistantMessage = candidate.content.parts[0].text || assistantMessage
        }
      }

      return NextResponse.json({ message: assistantMessage })
    } catch (error) {
      console.error("Request error:", error)
      return NextResponse.json({ error: "An error occurred while processing your request" }, { status: 500 })
    }
  } catch (error) {
    console.error("Request error:", error)
    return NextResponse.json({ error: "An error occurred while processing your request" }, { status: 500 })
  }
}
