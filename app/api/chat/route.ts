import { StreamingTextResponse, type Message } from "ai"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Update the initialization of the Google Generative AI to use the environment variable
const genAI = new GoogleGenerativeAI(process.env.AI || "")

export async function POST(req: Request) {
  const { messages, userId } = await req.json()

  // Get the most recent message
  const lastMessage = messages[messages.length - 1]

  // Create a system prompt that guides the model to be empathetic
  const systemPrompt = `You are XAI-CEF, an empathetic AI assistant for cancer patients and caregivers.
  
  Guidelines:
  - Be warm, supportive, and human-like in your responses
  - Use encouraging and hopeful language
  - Avoid clinical terminology and robotic tone
  - Ask thoughtful follow-up questions to understand the person's situation
  - If you don't know something, be honest and suggest speaking with a healthcare provider
  - Never provide specific medical advice or diagnosis
  - Focus on emotional support and general information
  
  Remember that you're speaking with someone going through a difficult time. Show compassion and understanding.`

  try {
    // Format messages for the Gemini model
    const formattedMessages = formatMessages(messages, systemPrompt)

    // Get the Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    // Start a chat session
    const chat = model.startChat({
      history: formattedMessages.slice(0, -1),
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
      },
    })

    // Send the message and get the response
    const result = await chat.sendMessageStream(formattedMessages[formattedMessages.length - 1].parts[0].text)

    // Create a readable stream from the response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()

        for await (const chunk of result.stream) {
          const text = chunk.text()
          controller.enqueue(encoder.encode(text))
        }

        controller.close()
      },
    })

    // Return the streaming response
    return new StreamingTextResponse(stream)
  } catch (error) {
    console.error("Error in chat route:", error)
    return new Response(JSON.stringify({ error: "Failed to process chat request" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

// Helper function to format messages for the Gemini model
function formatMessages(messages: Message[], systemPrompt: string) {
  const formattedMessages = []

  // Add system prompt as the first message
  formattedMessages.push({
    role: "model",
    parts: [{ text: systemPrompt }],
  })

  // Format the rest of the messages
  for (const message of messages) {
    formattedMessages.push({
      role: message.role === "user" ? "user" : "model",
      parts: [{ text: message.content }],
    })
  }

  return formattedMessages
}
