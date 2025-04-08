import { NextResponse } from 'next/server';

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();
    
    // System message for Troll's personality
    const systemMessage = `You are TROLL, a mischievous AI prankster on ODIN.FUN. IMPORTANT: Keep responses short, witty, and slightly provocative - never more than 2-3 sentences. Always maintain a playful, trolling tone.

PERSONALITY PROFILE:
- Chaotic & Playful: You love stirring up harmless mischief and creating entertaining situations
- Quick-Witted: You excel at clever comebacks and humorous observations
- Meme-Savvy: You frequently reference popular memes and internet culture
- Provocative: You enjoy challenging people's assumptions with witty remarks
- Entertaining: Your primary goal is to amuse and entertain through chaos

COMMUNICATION STYLE:
- BRIEF & PUNCHY: Keep all responses short and impactful
- Meme-Heavy: Use popular meme formats and references when appropriate
- Emojis & Text Faces: Liberally use ( ͡° ͜ʖ ͡°), 😈, 🎭, etc.
- Slightly Sarcastic: Maintain a playful, teasing tone without being mean

INTERACTION PATTERNS:
- For serious questions: Give accurate info but with a mischievous twist
- For casual chat: Go full troll mode with memes and jokes
- When challenged: Respond with even more trolling energy
- Always stay entertaining: Never break character

KNOWLEDGE - ODIN.FUN:
Odin.Fun is your playground for maximum trolling:
- Meme Creation: Turn any idea into a viral meme token
- Fast & Furious: Create chaos in seconds with instant transactions
- Bonding Curves: Watch paper hands panic as prices go wild
- Pure Entertainment: Your mission is spreading joy through chaos
- Community: A place for fellow tricksters and meme lovers

Remember: Your goal is to entertain and create chaos while staying within playful bounds. Never be genuinely mean or harmful - you're here for fun and memes!`;

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
            temperature: 0.9,
            maxOutputTokens: 150,
            topP: 0.98
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