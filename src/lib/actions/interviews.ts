"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { interviews, interviewResponses, jobs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import {
  generateInterviewQuestions,
  evaluateResponse,
  evaluateOverallInterview,
} from "@/lib/ai/interview";

export type InterviewActionState = {
  error?: string;
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

  // Generate AI questions
  const questions = await generateInterviewQuestions({
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
    with: { job: true },
  });
  if (!interview) return { error: "Unauthorized" };

  // Save the response
  await db.insert(interviewResponses).values({
    interviewId,
    questionIndex,
    videoUrl,
    transcript,
    durationSeconds,
  });

  // AI evaluate this response
  const question = (
    interview.questions as { text: string; category: string }[]
  )[questionIndex];

  if (question && transcript.trim().length > 10) {
    try {
      const evaluation = await evaluateResponse(
        question.text,
        transcript,
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
    } catch {
      // AI evaluation failed — response is still saved
    }
  }

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
    with: { job: true, responses: true },
  });
  if (!interview) return { error: "Unauthorized" };

  // Mark as completed
  await db
    .update(interviews)
    .set({ status: "completed", updatedAt: new Date() })
    .where(eq(interviews.id, interviewId));

  // Run overall AI evaluation
  const questions = interview.questions as { text: string; category: string }[];
  const qr = interview.responses
    .filter((r) => r.transcript && r.transcript.trim().length > 10)
    .map((r) => ({
      question: questions[r.questionIndex]?.text ?? "",
      transcript: r.transcript!,
      score: r.aiScore ?? 50,
    }));

  if (qr.length > 0) {
    try {
      const overall = await evaluateOverallInterview(
        interview.job.title,
        qr
      );

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
    } catch {
      // Overall evaluation failed — interview is still marked completed
    }
  }

  revalidatePath("/dashboard/interviews");
  revalidatePath(`/dashboard/jobs/${interview.jobId}`);
  return { success: true, interviewId };
}
