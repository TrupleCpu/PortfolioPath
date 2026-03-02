import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini API client
// We use the environment variable for the API key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface AnalysisResult {
  tech_stack: {
    language: string;
  };
  performance: {
    time_complexity: string;
    space_complexity: string;
    bottleneck_analysis: string;
  };
  code_review: {
    score: number;
    positive_observations: string[];
    refactoring_suggestions: string[];
  };
  professional_impact: {
    resume_bullets: string[];
  };
}

export async function analyzeCode(code: string): Promise<AnalysisResult> {
  const model = "gemini-2.5-flash";
  
  const prompt = `
    You are an expert senior software engineer and technical interviewer. 
    Analyze the following code snippet and generate a structured report.
    
    Return ONLY a valid JSON object with the following structure (no markdown formatting, just raw JSON):
    {
      "tech_stack": { "language": "Language Name" },
      "performance": { 
        "time_complexity": "Big O notation", 
        "space_complexity": "Big O notation", 
        "bottleneck_analysis": "Brief analysis of performance bottlenecks" 
      },
      "code_review": { 
        "score": number (0-100), 
        "positive_observations": ["point 1", "point 2"], 
        "refactoring_suggestions": ["suggestion 1", "suggestion 2"] 
      },
      "professional_impact": { 
        "resume_bullets": [
          "Action-oriented bullet point for a resume focusing on what this code achieves",
          "Another bullet point highlighting technical skills used",
          "Third bullet point emphasizing optimization or problem-solving"
        ] 
      }
    }

    Code to analyze:
    ${code}
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }

    // Clean up markdown code blocks if present
    const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();

    return JSON.parse(cleanText) as AnalysisResult;
  } catch (error) {
    console.error("Error analyzing code:", error);
    throw error;
  }
}
