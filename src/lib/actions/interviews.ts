"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { interviews, interviewResponses, jobs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import {
  generateInterviewQuestions,
  generateInterviewQuestionsWithMeta,
  evaluateResponse,
  evaluateOverallInterview,
} from "@/lib/ai/interview";
import { createNotification } from "@/lib/dal/notifications";
import { checkRateLimit } from "@/lib/rate-limit";

export type InterviewActionState = {
  error?: string;
  warning?: string;
  success?: boolean;
  interviewId?: string;
};

// Employer: create interview for a candidate
export async function createInterviewAction(
  jobId: string,
  candidateId: string
): Promise<InterviewActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Verify employer owns this job
  const job = await db.query.jobs.findFirst({
    where: and(eq(jobs.id, jobId), eq(jobs.employerId, user.id)),
  });
  if (!job) return { error: "Unauthorized" };

  // Check if interview already exists
  const existing = await db.query.interviews.findFirst({
    where: and(
      eq(interviews.jobId, jobId),
      eq(interviews.candidateId, candidateId)
    ),
  });
  if (existing) return { interviewId: existing.id, success: true };

  const rl = await checkRateLimit("aiInterviewGenerate", user.id);
  if (!rl.allowed) return { error: "tooManyAttempts" };

  // Generate AI questions
  const { questions, usedFallback } = await generateInterviewQuestionsWithMeta({
    title: job.title,
    description: job.description,
    skills: job.skills as string[] | null,
    experienceLevel: job.experienceLevel,
  });

  const [interview] = await db
    .insert(interviews)
    .values({
      jobId,
      candidateId,
      questions,
      status: "pending",
    })
    .returning({ id: interviews.id });

  // If AI fell back to generic questions, let the employer know so they
  // can regenerate or edit before sending the candidate.
  if (usedFallback) {
    createNotification({
      userId: user.id,
      type: "status_change",
      title: "Interview questions ready — please review",
      message: `AI was unavailable, so we generated fallback questions for ${job.title}. Edit or regenerate them before the candidate starts.`,
      relatedUrl: `/dashboard/interviews/${interview.id}`,
    }).catch(() => {});
  }

  revalidatePath(`/dashboard/jobs/${jobId}`);
  revalidatePath("/dashboard/interviews");
  return { interviewId: interview.id, success: true };
}

// Candidate: start the interview
export async function startInterviewAction(
  interviewId: string
): Promise<InterviewActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const interview = await db.query.interviews.findFirst({
    where: and(
      eq(interviews.id, interviewId),
      eq(interviews.candidateId, user.id)
    ),
  });
  if (!interview) return { error: "Unauthorized" };
  if (interview.status !== "pending") return { error: "alreadyStarted" };

  await db
    .update(interviews)
    .set({ status: "in_progress", updatedAt: new Date() })
    .where(eq(interviews.id, interviewId));

  return { success: true, interviewId };
}

// Candidate: submit a single response
export async function submitResponseAction(
  interviewId: string,
  questionIndex: number,
  videoUrl: string,
  transcript: string,
  durationSeconds: number
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const interview = await db.query.interviews.findFirst({
    where: and(
      eq(interviews.id, interviewId),
      eq(interviews.candidateId, user.id)
    ),
  });
  if (!interview) return { error: "Unauthorized" };

  // Delete any previous response for this question (re-recording replaces it)
  await db
    .delete(interviewResponses)
    .where(
      and(
        eq(interviewResponses.interviewId, interviewId),
        eq(interviewResponses.questionIndex, questionIndex)
      )
    );

  // Save the new response (AI evaluation is deferred — employer triggers it manually)
  await db.insert(interviewResponses).values({
    interviewId,
    questionIndex,
    videoUrl,
    transcript,
    durationSeconds,
  });

  return { success: true };
}

// Candidate: complete the interview (all questions answered)
export async function completeInterviewAction(
  interviewId: string
): Promise<InterviewActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const interview = await db.query.interviews.findFirst({
    where: and(
      eq(interviews.id, interviewId),
      eq(interviews.candidateId, user.id)
    ),
    with: { job: true },
  });
  if (!interview) return { error: "Unauthorized" };

  // Mark as completed (AI evaluation is deferred — employer triggers it manually)
  await db
    .update(interviews)
    .set({ status: "completed", updatedAt: new Date() })
    .where(eq(interviews.id, interviewId));

  // Notify employer that the candidate completed the interview
  createNotification({
    userId: interview.job.employerId,
    type: "interview_completed",
    title: "Interview Completed",
    message: `A candidate completed their interview for ${interview.job.title}`,
    relatedUrl: `/dashboard/interviews/${interviewId}`,
  }).catch(() => {});

  revalidatePath("/dashboard/interviews");
  revalidatePath(`/dashboard/jobs/${interview.jobId}`);
  return { success: true, interviewId };
}

// ─── Employer: delete an interview (any status) ───────────────────────────

export async function deleteInterviewAction(
  interviewId: string
): Promise<{ error?: string; success?: boolean; jobId?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const interview = await db.query.interviews.findFirst({
    where: eq(interviews.id, interviewId),
    with: { job: true },
  });
  if (!interview || interview.job.employerId !== user.id)
    return { error: "Unauthorized" };

  // FK cascade on interviewResponses handles child rows.
  await db.delete(interviews).where(eq(interviews.id, interviewId));

  revalidatePath("/dashboard/interviews");
  revalidatePath(`/dashboard/jobs/${interview.jobId}`);
  return { success: true, jobId: interview.jobId };
}

// ─── Employer: edit / regenerate interview questions (while pending) ──────

export async function updateInterviewQuestionsAction(
  interviewId: string,
  questions: { text: string; category: string }[]
): Promise<InterviewActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Validate
  if (!Array.isArray(questions) || questions.length === 0)
    return { error: "validationError" };
  if (questions.length > 10) return { error: "validationError" };
  const validCategories = new Set(["technical", "behavioral", "cultural"]);
  for (const q of questions) {
    if (
      !q ||
      typeof q.text !== "string" ||
      q.text.trim().length === 0 ||
      q.text.length > 1000 ||
      typeof q.category !== "string" ||
      !validCategories.has(q.category)
    ) {
      return { error: "validationError" };
    }
  }

  const interview = await db.query.interviews.findFirst({
    where: eq(interviews.id, interviewId),
    with: { job: true },
  });
  if (!interview || interview.job.employerId !== user.id)
    return { error: "Unauthorized" };
  if (interview.status !== "pending") return { error: "alreadyStarted" };

  const cleaned = questions.map((q) => ({
    text: q.text.trim(),
    category: q.category,
  }));

  await db
    .update(interviews)
    .set({ questions: cleaned, updatedAt: new Date() })
    .where(eq(interviews.id, interviewId));

  revalidatePath(`/dashboard/interviews/${interviewId}`);
  return { success: true, interviewId };
}

export async function regenerateInterviewQuestionsAction(
  interviewId: string
): Promise<InterviewActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const interview = await db.query.interviews.findFirst({
    where: eq(interviews.id, interviewId),
    with: { job: true },
  });
  if (!interview || interview.job.employerId !== user.id)
    return { error: "Unauthorized" };
  if (interview.status !== "pending") return { error: "alreadyStarted" };

  const rl = await checkRateLimit("aiInterviewGenerate", user.id);
  if (!rl.allowed) return { error: "tooManyAttempts" };

  const { questions, usedFallback } = await generateInterviewQuestionsWithMeta({
    title: interview.job.title,
    description: interview.job.description,
    skills: interview.job.skills as string[] | null,
    experienceLevel: interview.job.experienceLevel,
  });

  await db
    .update(interviews)
    .set({ questions, updatedAt: new Date() })
    .where(eq(interviews.id, interviewId));

  revalidatePath(`/dashboard/interviews/${interviewId}`);
  return {
    success: true,
    interviewId,
    ...(usedFallback ? { warning: "aiFallback" } : {}),
  };
}

// ─── Employer: AI evaluate a single response on demand ─────────────────────

export async function evaluateResponseAction(
  interviewId: string,
  questionIndex: number
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Verify employer owns the job
  const interview = await db.query.interviews.findFirst({
    where: eq(interviews.id, interviewId),
    with: { job: true, responses: true },
  });
  if (!interview || interview.job.employerId !== user.id)
    return { error: "Unauthorized" };

  const rl = await checkRateLimit("aiEvaluate", user.id);
  if (!rl.allowed) return { error: "tooManyAttempts" };

  const response = interview.responses.find(
    (r) => r.questionIndex === questionIndex
  );
  if (!response || !response.transcript) return { error: "No response found" };

  const questions = interview.questions as { text: string; category: string }[];
  const question = questions[questionIndex];
  if (!question) return { error: "Invalid question" };

  const evaluation = await evaluateResponse(
    question.text,
    response.transcript,
    interview.job.title
  );

  await db
    .update(interviewResponses)
    .set({
      aiScore: evaluation.score,
      aiFeedback: evaluation.feedback,
      aiImprovements: evaluation.improvements,
    })
    .where(
      and(
        eq(interviewResponses.interviewId, interviewId),
        eq(interviewResponses.questionIndex, questionIndex)
      )
    );

  revalidatePath(`/dashboard/interviews/${interviewId}`);
  return { success: true };
}

// ─── Employer: AI evaluate the entire interview on demand ──────────────────

export async function evaluateInterviewAction(
  interviewId: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const interview = await db.query.interviews.findFirst({
    where: eq(interviews.id, interviewId),
    with: { job: true, responses: true },
  });
  if (!interview || interview.job.employerId !== user.id)
    return { error: "Unauthorized" };

  const questions = interview.questions as { text: string; category: string }[];

  // First evaluate any unevaluated responses
  for (const r of interview.responses) {
    if (r.aiScore == null && r.transcript && r.transcript.trim().length > 10) {
      const q = questions[r.questionIndex];
      if (!q) continue;
      try {
        const evaluation = await evaluateResponse(
          q.text,
          r.transcript,
          interview.job.title
        );
        await db
          .update(interviewResponses)
          .set({
            aiScore: evaluation.score,
            aiFeedback: evaluation.feedback,
            aiImprovements: evaluation.improvements,
          })
          .where(
            and(
              eq(interviewResponses.interviewId, interviewId),
              eq(interviewResponses.questionIndex, r.questionIndex)
            )
          );
        r.aiScore = evaluation.score;
      } catch {
        // Continue with other responses
      }
    }
  }

  // Now do overall evaluation
  const qr = interview.responses
    .filter((r) => r.transcript && r.transcript.trim().length > 10)
    .map((r) => ({
      question: questions[r.questionIndex]?.text ?? "",
      transcript: r.transcript!,
      score: r.aiScore ?? 50,
    }));

  if (qr.length === 0) return { error: "No responses to evaluate" };

  const overall = await evaluateOverallInterview(interview.job.title, qr);

  await db
    .update(interviews)
    .set({
      status: "evaluated",
      overallScore: overall.overallScore,
      overallFeedback: overall.overallFeedback,
      overallImprovements: overall.overallImprovements,
      updatedAt: new Date(),
    })
    .where(eq(interviews.id, interviewId));

  // Notify candidate that their interview was evaluated
  createNotification({
    userId: interview.candidateId,
    type: "interview_evaluated",
    title: "Interview Evaluated",
    message: `Your interview for ${interview.job.title} has been evaluated — score: ${overall.overallScore}%`,
    relatedUrl: `/dashboard/interviews/${interviewId}`,
  }).catch(() => {});

  revalidatePath(`/dashboard/interviews/${interviewId}`);
  revalidatePath("/dashboard/interviews");
  return { success: true };
}
