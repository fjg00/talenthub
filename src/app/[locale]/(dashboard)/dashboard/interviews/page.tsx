import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/dal/profiles";
import { getInterviewsByCandidate } from "@/lib/dal/interviews";
import { getTranslations } from "next-intl/server";
import { Video, Sparkles, ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function InterviewsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  if (!profile || profile.role !== "candidate") redirect("/dashboard");

  const interviews = await getInterviewsByCandidate(user.id);
  const t = await getTranslations("interview");

  if (interviews.length === 0) {
    return (
      <div className="py-16 text-center">
        <Video className="mx-auto h-12 w-12 text-muted-foreground/30" />
        <h2 className="mt-4 text-lg font-semibold text-foreground">
          {t("noInterviews")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("noInterviewsDesc")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>

      <div className="space-y-3">
        {interviews.map((interview) => {
          const companyName =
            interview.job.employer?.employerProfile?.companyName ??
            interview.job.employer?.fullName ??
            "";

          const statusColor =
            interview.status === "evaluated"
              ? "bg-success/10 text-success"
              : interview.status === "completed"
                ? "bg-primary/10 text-primary"
                : interview.status === "in_progress"
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "bg-violet-500/10 text-violet-600 dark:text-violet-400";

          return (
            <Link
              key={interview.id}
              href={`/dashboard/interviews/${interview.id}`}
              className="flex items-center justify-between rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-accent/50"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
                  <Sparkles className="h-5 w-5 text-violet-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {interview.job.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{companyName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {interview.overallScore != null && (
                  <span className="text-lg font-bold text-foreground">
                    {interview.overallScore}%
                  </span>
                )}
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColor}`}
                >
                  {t(interview.status)}
                </span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
