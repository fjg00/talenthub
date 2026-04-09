import { getAI, MODEL } from "./gemini";

interface JobContext {
  title: string;
  description: string;
  skills: string[] | null;
  experienceLevel: string | null;
}

export interface InterviewQuestion {
  text: string;
  category: string;
}

export async function generateInterviewQuestions(
  job: JobContext,
  count: number = 5
): Promise<InterviewQuestion[]> {
  const prompt = `You are an expert technical recruiter creating interview questions for a job position.

JOB:
- Title: ${job.title}
- Description: ${job.description}
- Required Skills: ${job.skills?.join(", ") ?? "Not specified"}
- Experience Level: ${job.experienceLevel ?? "Not specified"}

Generate exactly ${count} interview questions. Mix question types:
- 2 technical questions specific to the role
- 2 behavioral/situational questions
- 1 cultural fit / motivation question

Respond with ONLY valid JSON (no markdown, no code fences):
[
  { "text": "<the interview question>", "category": "<technical|behavioral|cultural>" }
]`;

  const fallbackQuestions: InterviewQuestion[] = [
    { text: `Tell us about your relevant experience for a ${job.title} role.`, category: "behavioral" },
    { text: `What technical skills make you a strong fit for this ${job.title} position?`, category: "technical" },
    { text: "Describe a challenging project you worked on and how you handled it.", category: "behavioral" },
    { text: `How would you apply ${job.skills?.slice(0, 3).join(", ") || "your skills"} in this role?`, category: "technical" },
    { text: "Why are you interested in this role and what motivates you?", category: "cultural" },
  ];

  try {
    const response = await getAI().models.generateContent({
      model: MODEL,
      contents: prompt,
      config: { temperature: 0.6, maxOutputTokens: 800 },
    });

    const text = response.text?.trim() ?? "";
    return JSON.parse(text) as InterviewQuestion[];
  } catch {
    // Gemini quota exceeded or other failure — return contextual fallback questions
    return fallbackQuestions;
  }
}

export interface ResponseEvaluation {
  score: number;
  feedback: string;
  improvements: string[];
}

export async function evaluateResponse(
  question: string,
  transcript: string,
  jobTitle: string
): Promise<ResponseEvaluation> {
  const prompt = `You are an expert interviewer evaluating a candidate's response to an interview question for a "${jobTitle}" position.

QUESTION: ${question}

CANDIDATE'S RESPONSE (transcript):
${transcript.slice(0, 3000)}

Evaluate the response on:
1. Relevance - Did they answer the question?
2. Depth - Did they provide specific examples or details?
3. Communication - Was the response clear and well-structured?
4. Technical accuracy (if applicable)

Respond with ONLY valid JSON (no markdown, no code fences):
{
  "score": <0-100>,
  "feedback": "<2-3 sentence evaluation of the response>",
  "improvements": [<up to 3 specific, actionable tips for improvement>]
}`;

  const response = await getAI().models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { temperature: 0.3, maxOutputTokens: 400 },
  });

  const text = response.text?.trim() ?? "";

  try {
    return JSON.parse(text) as ResponseEvaluation;
  } catch {
    return {
      score: 50,
      feedback: "Could not fully evaluate this response.",
      improvements: ["Try providing more specific examples."],
    };
  }
}

export interface OverallEvaluation {
  overallScore: number;
  overallFeedback: string;
  overallImprovements: string[];
}

export async function evaluateOverallInterview(
  jobTitle: string,
  questionsAndResponses: { question: string; transcript: string; score: number }[]
): Promise<OverallEvaluation> {
  const qrSummary = questionsAndResponses
    .map(
      (qr, i) =>
        `Q${i + 1}: ${qr.question}\nAnswer: ${qr.transcript.slice(0, 500)}\nScore: ${qr.score}/100`
    )
    .join("\n\n");

  const prompt = `You are an expert interviewer providing an overall evaluation of a candidate's interview for a "${jobTitle}" position.

INTERVIEW SUMMARY:
${qrSummary}

Provide an overall assessment. Respond with ONLY valid JSON (no markdown, no code fences):
{
  "overallScore": <0-100 weighted average considering all responses>,
  "overallFeedback": "<3-4 sentence overall assessment of the candidate's interview performance>",
  "overallImprovements": [<up to 5 key areas where the candidate should improve for future interviews>]
}`;

  const response = await getAI().models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { temperature: 0.3, maxOutputTokens: 600 },
  });

  const text = response.text?.trim() ?? "";

  try {
    return JSON.parse(text) as OverallEvaluation;
  } catch {
    const avg = Math.round(
      questionsAndResponses.reduce((a, b) => a + b.score, 0) /
        questionsAndResponses.length
    );
    return {
      overallScore: avg,
      overallFeedback: "Overall evaluation could not be generated.",
      overallImprovements: ["Practice providing structured responses."],
    };
  }
}
