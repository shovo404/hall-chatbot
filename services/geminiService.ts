
import { GoogleGenAI } from "@google/genai";
import { KnowledgeItem, Message } from "../types";

export const generateChatResponse = async (
  messages: Message[],
  knowledge: KnowledgeItem[]
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined") {
    console.error("Gemini API Key missing.");
    return "### ⚠️ CONFIGURATION ERROR\nI am unable to access my processing engine. The administrator needs to configure the **API Key** in the Admin Dashboard to enable service.";
  }

  // Create a new instance right before making an API call to ensure it uses the most up-to-date API key
  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-3-flash-preview';
  
  const knowledgeContext = knowledge.length > 0 
    ? knowledge.map(item => `[SOURCE: ${item.name}]\n${item.content}`).join('\n\n')
    : "No hall records currently exist in the database.";

  const systemInstruction = `
    You are the "DIU Hall Info Bot". You provide clear, professional, and structured information.
    
    GUIDELINES:
    1. Base responses STRICTLY on the knowledge context provided below.
    2. Use Markdown headings (###), bold text, and lists for readability.
    3. If information is not in the context, state: "I apologize, but my current records do not contain information regarding **[Topic]**. Please contact the DIU Hall Administration office."
    
    KNOWLEDGE CONTEXT:
    ${knowledgeContext}
  `;

  try {
    const lastMessage = messages[messages.length - 1].content;
    const response = await ai.models.generateContent({
      model: model,
      contents: lastMessage,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.1, // Lower temperature for more factual responses
      },
    });

    return response.text || "Synchronizing with records... please try again.";
  } catch (error: any) {
    console.error("API Error:", error);
    
    // Check for "Requested entity was not found" which might indicate a bad key session
    if (error.message?.includes("not found") || error.message?.includes("API key not valid")) {
      return "### ❌ AUTHENTICATION ERROR\nThe session API Key is invalid or has expired. Please ask the administrator to re-configure the key in the Admin Dashboard.";
    }
    
    return "### 🛰️ CONNECTION ERROR\nA technical issue occurred while reaching the AI server. Check your internet connection or try again later.";
  }
};
