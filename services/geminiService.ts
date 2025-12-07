import { GoogleGenAI, Type } from "@google/genai";
import { DailyReport } from '../types';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing from environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateAuditReport = async (reports: DailyReport[]): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "AI Service Unavailable: Missing API Key.";

  // Prepare concise data context for the AI
  const summaryData = reports.map(r => ({
    date: r.date,
    field: r.fieldName,
    well: r.wellId,
    oil: r.oilProducedBbl,
    employeesAffected: r.employeesAffected,
    weather: r.weatherCondition
  }));

  const prompt = `
    You are an AI Auditor for an Oil & Gas company. 
    Review the following operational data for the selected period and generate a formal Audit Report.
    
    Data Provided (JSON):
    ${JSON.stringify(summaryData)}
    
    REQUIREMENTS:
    1. **Oil Production**: Summarize total production. Identify trends (rising/falling).
    2. **Safety Report**: Answer "How many employees were affected by an accident?". List specific dates and Wells if any accidents occurred.
    3. **Weather Impact**: Answer "How was the weather?". Analyze if weather (e.g., Stormy, Windy) had any correlation with lower production or accidents.
    4. **Conclusion**: Is the operation efficient and safe?

    Keep the tone professional and factual. Use Markdown formatting.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.2, // Low temp for factual analysis
      }
    });

    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Failed to generate AI audit report. Please try again later.";
  }
};