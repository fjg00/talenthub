import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/dal/profiles";
import {
  getInterviewsByCandidate,
  getInterviewsByEmployer,
} from "@/lib/dal/interviews";
import {
  getSchedulesByCandidate,
  getSchedulesByEmployer,
} from "@/lib/dal/interview-schedules";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Video, Sparkles, ChevronRight, CalendarClock } from "lucide-react";
import { ScheduledInterviewCard } from "@/components/dashboard/scheduled-interview-card";

export default async function InterviewsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  if (!profile) redirect("/login");

  const t = await getTranslations("interview");

  if (profile.role === "employer") {
    return <EmployerInterviews userId={user.id} />;
  }

  return <CandidateInterviews userId={user.id} />;
}

// ─── Employer Interviews ──────────────────────────────────────────────────────

async function EmployerInterviews({ userId }: { userId: string }) {
  const [interviews, schedules] = await Promise.all([
    getInterviewsByEmployer(userId),
    getSchedulesByEmployer(userId),
  ]);
  const t = await getTranslations("interview");
  const ts = await getTranslations("interviewSchedule");

  const scheduledSection = schedules.length > 0 && (
    <section className="space-y-3">
      <div>
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <CalendarClock className="h-4 w-4 text-primary" />
          {ts("scheduledInterviews")} ({schedules.length})
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {ts("scheduledInterviewsDesc")}
        </p>
      </div>
      <div className="space-y-3">
        {schedules.map((s) => (
          <ScheduledInterviewCard
            key={s.id}
            canManage
            item={{
              id: s.id,
              scheduledAt: s.scheduledAt,
              durationMinutes: s.durationMinutes,
              type: s.type,
              status: s.status,
              location: s.location,
              meetingUrl: s.meetingUrl,
              notes: s.notes,
              heading: s.candidate.fullName,
              subtitle: s.application.job.title,
            }}
          />
        ))}
      </div>
    </section>
  );

  if (interviews.length === 0 && schedules.length === 0) {
    return (
      <div className="py-16 text-center">
        <Video className="mx-auto h-12 w-12 text-muted-foreground/30" />
        <h2 className="mt-4 text-lg font-semibold text-foreground">
          {t("noInterviews")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("noInterviewsEmployerDesc")}
        </p>
      </div>
    );
  }

  if (interviews.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        {scheduledSection}
      </div>
    );
  }

  // Group by status
  const evaluated = interviews.filter((i) => i.status === "evaluated");
  const completed = interviews.filter((i) => i.status === "completed");
  const inProgress = interviews.filter((i) => i.status === "in_progress");
  const pending = interviews.filter((i) => i.status === "pending");

  const groups = [
    { label: t("in_progress"), items: inProgress },
    { label: t("pending"), items: pending },
    { label: t("evaluated"), items: evaluated },
    { label: t("completed"), items: completed },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <span className="text-sm text-muted-foreground">
          {interviews.length} total
        </span>
      </div>

      {scheduledSection}

      <section className="space-y-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Sparkles className="h-4 w-4 text-violet-500" />
            {t("aiInterviewsSection")} ({interviews.length})
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("aiInterviewsEmployerDesc")}
          </p>
        </div>

        {groups.map((group) => (
        <div key={group.label} className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            {group.label} ({group.items.length})
          </h2>
          {group.items.map((interview) => {
            const cp = interview.candidate.candidateProfile;
            const responseCount = interview.responses.length;
            const questionCount = (interview.questions as unknown[]).length;

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
                    <Video className="h-5 w-5 text-violet-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {interview.candidate.fullName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {interview.job.title}
                      {cp?.headline ? ` · ${cp.headline}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {responseCount}/{questionCount} {t("answered")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {interview.overallScore != null && (
                    <span
                      className={`text-lg font-bold ${
                        interview.overallScore >= 75
                          ? "text-success"
                          : interview.overallScore >= 50
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-error"
                      }`}
                    >
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
        ))}
      </section>
    </div>
  );
}

// ─── Candidate Interviews ─────────────────────────────────────────────────────

async function CandidateInterviews({ userId }: { userId: string }) {
  const [interviews, schedules] = await Promise.all([
    getInterviewsByCandidate(userId),
    getSchedulesByCandidate(userId),
  ]);
  const t = await getTranslations("interview");
  const ts = await getTranslations("interviewSchedule");

  const scheduledSection = schedules.length > 0 && (
    <section className="space-y-3">
      <div>
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <CalendarClock className="h-4 w-4 text-primary" />
          {ts("scheduledInterviews")} ({schedules.length})
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {ts("scheduledInterviewsDesc")}
        </p>
      </div>
      <div className="space-y-3">
        {schedules.map((s) => {
          const companyName =
            s.employer?.employerProfile?.companyName ??
            s.employer?.fullName ??
            "";
          return (
            <ScheduledInterviewCard
              key={s.id}
              canManage={false}
              item={{
                id: s.id,
                scheduledAt: s.scheduledAt,
                durationMinutes: s.durationMinutes,
                type: s.type,
                status: s.status,
                location: s.location,
                meetingUrl: s.meetingUrl,
                notes: s.notes,
                heading: s.application.job.title,
                subtitle: companyName,
              }}
            />
          );
        })}
      </div>
    </section>
  );

  if (interviews.length === 0 && schedules.length === 0) {
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

      {scheduledSection}

      {interviews.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Sparkles className="h-4 w-4 text-violet-500" />
              {t("aiInterviewsSection")} ({interviews.length})
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("aiInterviewsCandidateDesc")}
            </p>
          </div>

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
        </section>
      )}
    </div>
  );
}
