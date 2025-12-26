
import { GoogleGenAI } from "@google/genai";
import { KnowledgeItem, Message } from "../types";

export const generateChatResponse = async (
  messages: Message[],
  knowledge: KnowledgeItem[]
): Promise<string> => {
  // Resolve the API key at runtime (prefer AI Studio session keys) and avoid embedding keys in the bundle
  const apiKey = await resolveApiKey();

  if (!apiKey || apiKey === 'undefined') {
    console.error('Gemini API Key missing or not initialized.');
    return "### ⚠️ CONFIGURATION ERROR\nI am unable to access the AI engine. The administrator needs to configure the **API Key** in the Admin Dashboard (select/initialize a key) to enable service.";
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

    const msg = error?.message || '';
    const status = error?.status || error?.statusCode || error?.code;

    if (msg.includes("not found") || msg.includes("API key not valid") || msg.includes("Invalid API key") || status === 401 || status === 403) {
      return "### ❌ AUTHENTICATION ERROR\nThe session API Key is invalid, revoked, or expired. Please ask the administrator to re-configure the key in the Admin Dashboard.";
    }

    return "### 🛰️ CONNECTION ERROR\nA technical issue occurred while reaching the AI server. Check your logs for details and try again later.";
  }
};

// Utility to resolve the active API key/session without leaking secrets
async function resolveApiKey(): Promise<string | undefined> {
  let apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (typeof window !== 'undefined') {
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      try {
        if (typeof aistudio.getSelectedApiKey === 'function') {
          const key = await aistudio.getSelectedApiKey();
          if (key) return key;
        }
        if (typeof aistudio.getApiKey === 'function') {
          const key = await aistudio.getApiKey();
          if (key) return key;
        }
        if (typeof aistudio.hasSelectedApiKey === 'function') {
          const has = await aistudio.hasSelectedApiKey();
          if (has && apiKey) return apiKey;
        }
      } catch (err) {
        // ignore and fall back to env var
      }
    }
  }
  return apiKey;
}

// Validate that the current key/session can authenticate with the Gemini API
export const validateApiKey = async (): Promise<{ ok: boolean; message?: string }> => {
  const key = await resolveApiKey();
  if (!key) return { ok: false, message: 'No API key configured' };
  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const test = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: 'Ping',
      config: { temperature: 0.0, maxOutputTokens: 16 },
    });
    if (test?.text) return { ok: true };
    return { ok: false, message: 'Unexpected response from API' };
  } catch (err: any) {
    const msg = err?.message || 'Unknown error';
    const status = err?.status || err?.statusCode || err?.code;
    if (msg.includes('not found') || msg.includes('API key not valid') || status === 401 || status === 403) {
      return { ok: false, message: 'Authentication failed: invalid or expired API key' };
    }
    return { ok: false, message: `Connection error: ${msg}` };
  }
};
