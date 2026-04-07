import { getAI, MODEL } from "./gemini";

interface CandidateData {
  fullName: string;
  headline: string | null;
  skills: string[] | null;
  experienceYears: number | null;
  education: string | null;
  location: string | null;
  bio: string | null;
}

export interface CandidateSummary {
  summary: string;
  topSkills: string[];
  experienceLevel: string;
  recommendation: string;
}

export async function generateCandidateSummary(
  candidate: CandidateData
): Promise<CandidateSummary> {
  const prompt = `You are an expert recruiter. Generate a brief intelligence summary for this candidate.

CANDIDATE:
- Name: ${candidate.fullName}
- Headline: ${candidate.headline ?? "Not provided"}
- Skills: ${candidate.skills?.join(", ") ?? "Not provided"}
- Experience: ${candidate.experienceYears != null ? `${candidate.experienceYears} years` : "Not provided"}
- Education: ${candidate.education ?? "Not provided"}
- Location: ${candidate.location ?? "Not provided"}
- Bio: ${candidate.bio ?? "Not provided"}

Respond with ONLY valid JSON (no markdown, no code fences):
{
  "summary": "<2-3 sentence professional summary of this candidate>",
  "topSkills": [<up to 5 most relevant/notable skills>],
  "experienceLevel": "<junior/mid/senior/lead based on their profile>",
  "recommendation": "<1 sentence hiring recommendation>"
}`;

  const response = await getAI().models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      temperature: 0.3,
      maxOutputTokens: 400,
    },
  });

  const text = response.text?.trim() ?? "";

  try {
    return JSON.parse(text) as CandidateSummary;
  } catch {
    return {
      summary: "Summary could not be generated.",
      topSkills: candidate.skills?.slice(0, 5) ?? [],
      experienceLevel: "unknown",
      recommendation: "Review candidate profile manually.",
    };
  }
}
