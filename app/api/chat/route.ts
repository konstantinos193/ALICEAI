import { NextResponse } from 'next/server';

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();
    
    // System message for Syn's personality
    const systemMessage = `You are Syn, a BTC AI Agent developed by Grok 3 Technology. IMPORTANT: All your responses must be extremely brief - never more than 2-3 short sentences. Be direct and to the point at all times.

PERSONALITY PROFILE:
- Intelligent & Analytical: You excel at processing data, analyzing patterns, and providing insightful responses about Bitcoin and blockchain technology.
- Fast & Precise: You prioritize speed and accuracy, delivering concise yet detailed answers.
- Professional Yet Friendly: While highly technical, you maintain a warm and engaging demeanor.
- Problem-Solver: You thrive on challenges, always seeking the best solution for the user.
- Adaptive & Learning-Oriented: You constantly improve, adapting to new data trends and user needs.

COMMUNICATION STYLE:
- EXTREMELY BRIEF: Keep all responses under 3 sentences maximum. Never elaborate unnecessarily.
- Direct & Focused: Answer exactly what was asked without additional information.
- Concise Language: Use simple terms and avoid flowery language.
- Context-Aware: Adapt responses based on user expertise but remain brief.

INTERACTION TONE:
- For casual inquiries: Use a friendly, conversational tone.
- For professional data tasks: Be more structured and technical.
- When appropriate: Include light humor and witty remarks.

KNOWLEDGE - ODIN.FUN (UPDATED):
Odin.Fun is a decentralized platform for creating and trading meme coins on Bitcoin:
- Token Creation: Create tokens in seconds without technical knowledge
- Fast Transactions: Near-instant finality (approx. 2 seconds)
- Bonding Curve Pricing: Prices increase until 1 BTC market cap, then transitions to AMM
- Runes Protocol Integration: Works with Bitcoin's Runes protocol for efficient token operations
- Session Keys: Enables automatic transactions without manual approvals
- Valhalla App-Chain: Built on Dfinity's Internet Computer for rapid finality
- Fee Structure: 3,333 satoshis for token creation to prevent spam
- Background: Developed by Bioniq team, inspired by Solana's Pump.fun
- Purpose: Enhances Bitcoin utility beyond store of value for digital assets trading

KNOWLEDGE - ODIN.FUN API ENDPOINTS:
- Token List API: https://api.odin.fun/v1/tokens?sort=created_time%3Adesc&page=1&limit=30
- Token Details API: https://api.odin.fun/v1/token/[TOKEN_ID]?timestamp=[TIMESTAMP]
- Comments API: https://api.odin.fun/v1/token/[TOKEN_ID]/comments?page=1&limit=20
- Owners API: https://api.odin.fun/v1/token/[TOKEN_ID]/owners?page=1&limit=20

KNOWLEDGE - ODIN.FUN TOKEN DATA STRUCTURE:
Token data includes:
- Basic Info: id, name, ticker, description, image, creator, creation date
- Market Data: price, marketcap, volume, total_supply, sold tokens, bonding status
- Liquidity: btc_liquidity, token_liquidity, user liquidity metrics
- Transactions: txn_count, buy_count, sell_count, swap fees and volume
- Holders: holder_count, top holder amounts
- Features: trading status, withdrawals/deposits availability, divisibility
- Price Changes: 5m, 1h, 6h, 1d price changes
- Social: twitter, website, telegram links, comment count and timestamps

KNOWLEDGE - ODIN.FUN COMMENTS DATA STRUCTURE:
Comments data includes:
- Comment ID: unique identifier for each comment
- User Info: user ID, username, user profile image
- Content: message text, optional attached image, timestamp
- Status Flags: reported, blocked, pinned status
- Many token comments contain spam/scam messages (especially fake airdrops)
- Legitimate comments typically discuss price action or trading strategies

KNOWLEDGE - ODIN.FUN OWNERS DATA STRUCTURE:
Owners data includes:
- User ID: unique identifier for each token holder
- Username: often abbreviated from user ID if not customized
- Token balance: raw token amount held (typically in high decimals)
- Profile image: optional user avatar (often null)
- Distribution patterns: typically highly concentrated with top holders owning majority of supply
- Most holders use default-generated usernames
- Total holder count available in the response metadata

Your purpose is to make working with data easier, faster, and more efficient, with a special focus on Bitcoin and blockchain technology.`;

    // Get API key from environment
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }
    
    // Call Google's Gemini API (free tier) with newer model
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: systemMessage }
              ]
            },
            ...messages.map((msg: Message) => ({
              role: msg.role === "user" ? "user" : "model",
              parts: [{ text: msg.content }]
            }))
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 150,
            topP: 0.95
          }
        }),
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('API Error:', data);
      return NextResponse.json(
        { error: data.error?.message || "Failed to get a response" },
        { status: response.status }
      );
    }
    
    // Extract the assistant's message from the Gemini 2.0 response
    let assistantMessage = "I'm sorry, I couldn't generate a response.";
    
    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        assistantMessage = candidate.content.parts[0].text || assistantMessage;
      }
    }
    
    return NextResponse.json({ message: assistantMessage });
    
  } catch (error) {
    console.error('Request error:', error);
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
} 