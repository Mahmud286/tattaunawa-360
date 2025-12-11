import { GoogleGenAI, Type } from "@google/genai";
import { Consultant } from "../types";
import { MOCK_CONSULTANTS } from "../constants";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface AiResponse {
  message: string;
  recommendedConsultantIds: string[];
}

export const getGeminiResponse = async (
  userMessage: string,
  chatHistory: string
): Promise<AiResponse> => {
  try {
    // We provide a minimized version of the consultants to the context to save tokens
    const consultantContext = MOCK_CONSULTANTS.map(c => ({
      id: c.id,
      name: c.name,
      title: c.title,
      category: c.category,
      languages: c.languages,
      bio: c.bio,
      rate: c.hourlyRate
    }));

    const systemInstruction = `
      You are the Tattaunawa360 Smart Assistant. Your goal is to help users find the perfect expert consultant.
      
      Here is the list of available verified consultants:
      ${JSON.stringify(consultantContext)}

      Rules:
      1. Analyze the user's request.
      2. If they are looking for help, identify which consultant matches their needs based on category, bio, languages, or title.
      3. Be helpful, professional, and friendly.
      4. Always return the response in the specified JSON format.
      5. If no specific consultant matches perfectly, suggest the closest ones or ask clarifying questions.
      6. Support multiple languages in your text response if the user speaks another language.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: `History: ${chatHistory}\nUser: ${userMessage}`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            message: {
              type: Type.STRING,
              description: "The conversational response to the user."
            },
            recommendedConsultantIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "An array of IDs of the consultants you recommend based on the query. Empty if none relevant."
            }
          },
          required: ["message", "recommendedConsultantIds"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as AiResponse;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      message: "I'm having trouble connecting to the expert database right now. Please try browsing the list manually.",
      recommendedConsultantIds: []
    };
  }
};