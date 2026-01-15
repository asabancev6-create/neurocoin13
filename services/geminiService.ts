
import { GoogleGenAI, Type } from "@google/genai";
import { AITask } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateNeuralTask = async (): Promise<AITask | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      // Updated prompt to request Russian language output
      contents: "Generate a futuristic, crypto-themed trivia question related to blockchain, AI, or cybersecurity. It should be challenging but solvable. The output MUST be in Russian language.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            correctAnswerIndex: { type: Type.NUMBER },
            reward: { type: Type.NUMBER },
            difficulty: { type: Type.STRING, enum: ["EASY", "MEDIUM", "HARD"] }
          },
          required: ["question", "options", "correctAnswerIndex", "reward", "difficulty"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AITask;
    }
    return null;
  } catch (error) {
    console.error("Neural Link Error:", error);
    return null;
  }
};
