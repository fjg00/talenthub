import { generateText } from "./claude";

interface JobInput {
  title: string;
  description: string;
  location: string | null;
  jobType: string | null;
  experienceLevel: string | null;
  skills: string[] | null;
}

export interface JobOptimization {
  improvedDescription: string;
  suggestedSkills: string[];
  tips: string[];
}

export async function optimizeJobDescription(
  job: JobInput
): Promise<JobOptimization> {
  const prompt = `You are an expert recruiter and copywriter for the Middle East job market. Optimize this job posting to attract better candidates.

CURRENT JOB:
- Title: ${job.title}
- Description: ${job.description}
- Location: ${job.location ?? "Not specified"}
- Type: ${job.jobType ?? "Not specified"}
- Experience Level: ${job.experienceLevel ?? "Not specified"}
- Skills: ${job.skills?.join(", ") ?? "Not specified"}

Respond with ONLY valid JSON (no markdown, no code fences):
{
  "improvedDescription": "<improved, more compelling version of the job description — keep it professional and inclusive, 150-300 words>",
  "suggestedSkills": [<up to 5 additional skills that would be relevant for this role>],
  "tips": [<up to 3 short tips to improve this job posting>]
}`;

  const text = await generateText(prompt, { temperature: 0.5, maxTokens: 800 });

  try {
    return JSON.parse(text) as JobOptimization;
  } catch {
    return {
      improvedDescription: job.description,
      suggestedSkills: [],
      tips: ["Could not generate optimization suggestions."],
    };
  }
}
