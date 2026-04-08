import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/dal/profiles";
import { getInterviewById } from "@/lib/dal/interviews";
import { InterviewSession } from "@/components/dashboard/interview-session";
import { InterviewResults } from "@/components/dashboard/interview-results";
import { getTranslations } from "next-intl/server";

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

    // If completed/evaluated, show results
    if (
      interview.status === "completed" ||
      interview.status === "evaluated"
    ) {
      return (
        <div className="mx-auto max-w-3xl space-y-6">
          <h1 className="text-2xl font-bold text-foreground">
            {t("interviewFor")} {interview.job.title}
          </h1>
          <InterviewResults
            questions={questions}
            responses={interview.responses}
            overallScore={interview.overallScore}
            overallFeedback={interview.overallFeedback}
            overallImprovements={interview.overallImprovements as string[] | null}
            status={interview.status}
          />
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

    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t("interviewResults")}
          </h1>
          <p className="text-muted-foreground">
            {candidateName} — {interview.job.title}
          </p>
        </div>
        <InterviewResults
          questions={questions}
          responses={interview.responses}
          overallScore={interview.overallScore}
          overallFeedback={interview.overallFeedback}
          overallImprovements={interview.overallImprovements as string[] | null}
          status={interview.status}
        />
      </div>
    );
  }

  notFound();
}
