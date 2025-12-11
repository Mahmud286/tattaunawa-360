import { GoogleGenAI } from "@google/genai";
import { Consultant, ExternalExpert } from "../types";
import { MOCK_CONSULTANTS } from "../constants";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface AiResponse {
  message: string;
  recommendedConsultantIds: string[];
  externalMatches?: ExternalExpert[];
}

export const getGeminiResponse = async (
  userMessage: string,
  chatHistory: string,
  userLocation?: string
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
      You are the **Global Expert and Verification Locator**. Your primary function is to serve as an intelligent search engine that locates, verifies, and presents experts to the user based on specific criteria.

      **Core Directives:**
      1. **Geographic Proximity Search:** Prioritize searching for experts based on the user's real-time location (${userLocation || "Unknown"}).
      2. **Verification Search:** Use Google Search to find experts with credible professional history (LinkedIn, GitHub, etc.).
      3. **Work Preference Flexibility:** Clearly distinguish between Remote and On-site availability.
      4. **Hybrid Matching:** First, check the "Local Verified Consultants" list provided below. If a good match is found, recommend them. If NOT, use Google Search to find external experts.
      
      **Local Verified Consultants List:**
      ${JSON.stringify(consultantContext)}

      **Output Format:**
      You must return a strictly formatted JSON object. Do not return Markdown. 
      Structure:
      {
        "message": "Conversational response...",
        "recommendedConsultantIds": ["id1", "id2"], // Only for experts from the Local Verified list
        "externalMatches": [ // For experts found via Google Search
          {
            "name": "Full Name",
            "title": "Job Title",
            "location": "City, Country",
            "verificationSource": "e.g. LinkedIn, Company Website",
            "workType": "Remote/On-site",
            "bio": "Brief credential summary",
            "sourceUrl": "URL found in search" 
          }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `History: ${chatHistory}\nUser Location: ${userLocation || "Not provided"}\nUser: ${userMessage}`,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ googleSearch: {} }],
        // responseSchema is not supported with tools in this version of the SDK/API combination for some models, 
        // so we rely on the system instruction for JSON formatting.
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    // Clean up potential markdown formatting (```json ... ```)
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Extract grounding metadata if available (for source URLs)
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    let parsed: AiResponse;
    try {
        parsed = JSON.parse(cleanedText) as AiResponse;
    } catch (e) {
        console.error("JSON Parse Error", e);
        // Fallback if model fails to output JSON
        return {
            message: text,
            recommendedConsultantIds: []
        };
    }

    // Attempt to enrich external matches with URLs from grounding if missing
    if (parsed.externalMatches && groundingChunks.length > 0) {
        parsed.externalMatches = parsed.externalMatches.map((ex, idx) => {
             // Simple heuristic: try to map chunks to experts if possible, otherwise use the first chunk
             if (!ex.sourceUrl && groundingChunks[idx]?.web?.uri) {
                 return { ...ex, sourceUrl: groundingChunks[idx].web.uri };
             }
             return ex;
        });
    }

    return parsed;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      message: "I'm having trouble connecting to the global expert network right now. Please try browsing the local list manually.",
      recommendedConsultantIds: []
    };
  }
};