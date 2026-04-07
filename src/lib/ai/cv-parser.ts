import { getAI, MODEL } from "./gemini";

export interface ParsedCV {
  headline: string;
  skills: string[];
  experienceYears: number;
  education: string;
  location: string;
  bio: string;
}

export async function parseCVText(cvText: string): Promise<ParsedCV> {
  const prompt = `You are an expert resume/CV parser. Extract structured data from this CV text.

CV TEXT:
${cvText.slice(0, 5000)}

Respond with ONLY valid JSON (no markdown, no code fences):
{
  "headline": "<professional headline, e.g. 'Senior Software Engineer'>",
  "skills": [<list of technical and professional skills found>],
  "experienceYears": <estimated total years of experience as a number>,
  "education": "<highest education, e.g. 'BSc Computer Science, Cairo University'>",
  "location": "<location if mentioned, or empty string>",
  "bio": "<2-3 sentence professional summary based on the CV>"
}`;

  const response = await getAI().models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      temperature: 0.2,
      maxOutputTokens: 600,
    },
  });

  const text = response.text?.trim() ?? "";

  try {
    return JSON.parse(text) as ParsedCV;
  } catch {
    return {
      headline: "",
      skills: [],
      experienceYears: 0,
      education: "",
      location: "",
      bio: "",
    };
  }
}
