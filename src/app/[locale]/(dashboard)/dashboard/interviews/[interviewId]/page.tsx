import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/dal/profiles";
import { getInterviewById } from "@/lib/dal/interviews";
import { InterviewSession } from "@/components/dashboard/interview-session";
import { InterviewResults } from "@/components/dashboard/interview-results";
import { InterviewQuestionsEditor } from "@/components/dashboard/interview-questions-editor";
import { DeleteInterviewButton } from "@/components/dashboard/delete-interview-button";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  User,
  MapPin,
  Briefcase,
  ArrowLeft,
  Video,
  CheckCircle,
} from "lucide-react";

export default async function InterviewPage({
  params,
}: {
  params: Promise<{ interviewId: string }>;
}) {
  const { interviewId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  if (!profile) redirect("/login");

  const interview = await getInterviewById(interviewId);
  if (!interview) notFound();

  const t = await getTranslations("interview");
  const questions = interview.questions as { text: string; category: string }[];

  // Candidate view — take or review interview
  if (profile.role === "candidate") {
    if (interview.candidateId !== user.id) notFound();

    // If completed/evaluated, candidate can no longer access it
    if (
      interview.status === "completed" ||
      interview.status === "evaluated"
    ) {
      return (
        <div className="mx-auto max-w-2xl text-center">
          <div className="rounded-2xl border border-success/20 bg-success/5 p-8">
            <CheckCircle className="mx-auto h-12 w-12 text-success" />
            <h2 className="mt-4 text-xl font-bold text-foreground">
              {t("interviewComplete")}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {t("interviewCompleteDesc")}
            </p>
            <Link
              href="/dashboard/interviews"
              className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("title")}
            </Link>
          </div>
        </div>
      );
    }

    // Pending or in-progress — show interview session
    return (
      <InterviewSession
        interviewId={interview.id}
        questions={questions}
        status={interview.status}
        jobTitle={interview.job.title}
      />
    );
  }

  // Employer view — show results
  if (profile.role === "employer") {
    if (interview.job.employerId !== user.id) notFound();

    const candidateName =
      interview.candidate.fullName ?? t("unknownCandidate");
    const cp = interview.candidate.candidateProfile;
    const responseCount = interview.responses.length;
    const questionCount = questions.length;

    return (
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Back link */}
        <Link
          href="/dashboard/interviews"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("title")}
        </Link>

        {/* Candidate info card */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-500/10">
                  <User className="h-5 w-5 text-violet-500" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">
                    {candidateName}
                  </h1>
                  {cp?.headline && (
                    <p className="text-sm text-muted-foreground">
                      {cp.headline}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                {cp?.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {cp.location}
                  </span>
                )}
                {cp?.experienceYears != null && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3 w-3" /> {cp.experienceYears} {t("yearsExp")}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Video className="h-3 w-3" />
                  {responseCount}/{questionCount} {t("answered")}
                </span>
              </div>

              {cp?.skills && cp.skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {cp.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Job context */}
            <div className="text-end">
              <p className="text-sm font-medium text-foreground">
                {interview.job.title}
              </p>
              <span
                className={`mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                  interview.status === "evaluated"
                    ? "bg-success/10 text-success"
                    : interview.status === "completed"
                      ? "bg-primary/10 text-primary"
                      : interview.status === "in_progress"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "bg-violet-500/10 text-violet-600 dark:text-violet-400"
                }`}
              >
                {t(interview.status)}
              </span>
            </div>
          </div>
        </div>

        {/* Questions editor — only while interview hasn't started */}
        {interview.status === "pending" && (
          <InterviewQuestionsEditor
            interviewId={interview.id}
            initialQuestions={questions as {
              text: string;
              category: "technical" | "behavioral" | "cultural";
            }[]}
          />
        )}

        {/* Delete / cancel interview (employer only) */}
        <div className="flex justify-end">
          <DeleteInterviewButton
            interviewId={interview.id}
            hasResponses={responseCount > 0}
          />
        </div>

        {/* Interview results with video playback */}
        <InterviewResults
          interviewId={interview.id}
          questions={questions}
          responses={interview.responses}
          overallScore={interview.overallScore}
          overallFeedback={interview.overallFeedback}
          overallImprovements={interview.overallImprovements as string[] | null}
          status={interview.status}
          isEmployer
        />
      </div>
    );
  }

  notFound();
}
