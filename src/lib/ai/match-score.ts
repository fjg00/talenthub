import { generateText } from "./claude";

interface CandidateData {
  fullName: string;
  headline: string | null;
  skills: string[] | null;
  experienceYears: number | null;
  education: string | null;
  location: string | null;
  bio: string | null;
  coverLetter: string | null;
}

interface JobData {
  title: string;
  description: string;
  location: string | null;
  jobType: string | null;
  experienceLevel: string | null;
  skills: string[] | null;
  salaryMin: number | null;
  salaryMax: number | null;
}

export interface MatchResult {
  score: number; // 0-100
  strengths: string[];
  gaps: string[];
  summary: string;
}

export async function getMatchScore(
  candidate: CandidateData,
  job: JobData
): Promise<MatchResult> {
  const prompt = `You are an expert recruiter evaluating how well a candidate matches a job posting.

JOB:
- Title: ${job.title}
- Description: ${job.description}
- Location: ${job.location ?? "Not specified"}
- Type: ${job.jobType ?? "Not specified"}
- Experience Level: ${job.experienceLevel ?? "Not specified"}
- Required Skills: ${job.skills?.join(", ") ?? "Not specified"}

CANDIDATE:
- Name: ${candidate.fullName}
- Headline: ${candidate.headline ?? "Not provided"}
- Skills: ${candidate.skills?.join(", ") ?? "Not provided"}
- Experience: ${candidate.experienceYears != null ? `${candidate.experienceYears} years` : "Not provided"}
- Education: ${candidate.education ?? "Not provided"}
- Location: ${candidate.location ?? "Not provided"}
- Bio: ${candidate.bio ?? "Not provided"}
- Cover Letter: ${candidate.coverLetter ?? "Not provided"}

Evaluate the match and respond with ONLY valid JSON (no markdown, no code fences):
{
  "score": <number 0-100>,
  "strengths": [<up to 3 short bullet points about why this candidate is a good fit>],
  "gaps": [<up to 3 short bullet points about what's missing or weak>],
  "summary": "<1-2 sentence overall assessment>"
}`;

  const text = await generateText(prompt, { temperature: 0.3, maxTokens: 500 });

  try {
    return JSON.parse(text) as MatchResult;
  } catch {
    return {
      score: 50,
      strengths: ["Unable to fully evaluate"],
      gaps: ["Insufficient data for detailed analysis"],
      summary: "Match score could not be fully computed.",
    };
  }
}
