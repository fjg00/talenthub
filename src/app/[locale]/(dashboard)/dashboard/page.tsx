import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/dal/profiles";
import { getEmployerStats, getCandidateStats } from "@/lib/dal/applications";
import { getInterviewsByEmployer, getInterviewsByCandidate } from "@/lib/dal/interviews";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  Briefcase,
  Users,
  Video,
  TrendingUp,
  FileText,
  CheckCircle2,
  Clock,
  Target,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  if (!profile) redirect("/login");

  const t = await getTranslations("dashboard");

  if (profile.role === "employer") {
    return <EmployerOverview userId={user.id} name={profile.fullName} />;
  }

  return <CandidateOverview userId={user.id} name={profile.fullName} />;
}

// ─── Employer Overview ────────────────────────────────────────────────────────

async function EmployerOverview({ userId, name }: { userId: string; name: string }) {
  const [stats, interviews] = await Promise.all([
    getEmployerStats(userId),
    getInterviewsByEmployer(userId),
  ]);
  const t = await getTranslations("dashboard");

  const pendingInterviews = interviews.filter((i) => i.status === "pending" || i.status === "in_progress").length;
  const completedInterviews = interviews.filter((i) => i.status === "evaluated" || i.status === "completed").length;

  const statCards = [
    { label: t("activeJobs"), value: stats.activeJobs, icon: Briefcase, color: "text-primary bg-primary/10" },
    { label: t("totalApplicants"), value: stats.totalApplicants, icon: Users, color: "text-violet-600 bg-violet-500/10 dark:text-violet-400" },
    { label: t("interviewsPending"), value: pendingInterviews, icon: Video, color: "text-amber-600 bg-amber-500/10 dark:text-amber-400" },
    { label: t("hiredCount"), value: stats.hired, icon: CheckCircle2, color: "text-success bg-success/10" },
  ];

  const funnelSteps = [
    { label: t("applied"), count: stats.pending, color: "bg-muted-foreground" },
    { label: t("reviewed"), count: stats.reviewed, color: "bg-blue-500" },
    { label: t("shortlisted"), count: stats.shortlisted, color: "bg-amber-500" },
    { label: t("interviewing"), count: stats.interviewing, color: "bg-violet-500" },
    { label: t("offered"), count: stats.offered, color: "bg-emerald-500" },
    { label: t("hiredLabel"), count: stats.hired, color: "bg-success" },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-border bg-card p-5">
            <div className={`inline-flex rounded-xl p-2.5 ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div className="mt-3 text-3xl font-bold text-foreground">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Hiring Funnel */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">{t("hiringFunnel")}</h2>
            <Link href="/dashboard/analytics" className="text-sm text-primary hover:underline">
              {t("viewDetails")} →
            </Link>
          </div>
          <div className="space-y-3">
            {funnelSteps.map((step) => {
              const maxCount = Math.max(...funnelSteps.map((s) => s.count), 1);
              const width = Math.max((step.count / maxCount) * 100, 4);
              return (
                <div key={step.label} className="flex items-center gap-3">
                  <span className="w-24 text-sm text-muted-foreground">{step.label}</span>
                  <div className="flex-1">
                    <div className="h-6 overflow-hidden rounded-lg bg-accent">
                      <div
                        className={`h-full rounded-lg ${step.color} transition-all`}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-8 text-end text-sm font-medium text-foreground">{step.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Interviews */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">{t("recentInterviews")}</h2>
            <Link href="/dashboard/interviews" className="text-sm text-primary hover:underline">
              {t("viewAll")} →
            </Link>
          </div>
          {interviews.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              {t("noInterviewsYet")}
            </div>
          ) : (
            <div className="space-y-3">
              {interviews.slice(0, 5).map((interview) => {
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
                    className="flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-accent/50"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {interview.candidate.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground">{interview.job.title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {interview.overallScore != null && (
                        <span className="text-sm font-bold text-foreground">
                          {interview.overallScore}%
                        </span>
                      )}
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}>
                        {interview.status}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/dashboard/jobs/new"
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-accent/50"
        >
          <div className="rounded-xl bg-primary/10 p-2.5">
            <Briefcase className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">{t("postNewJob")}</p>
            <p className="text-xs text-muted-foreground">{t("postNewJobDesc")}</p>
          </div>
          <ArrowRight className="ms-auto h-5 w-5 text-muted-foreground" />
        </Link>
        <Link
          href="/dashboard/candidates"
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-accent/50"
        >
          <div className="rounded-xl bg-violet-500/10 p-2.5">
            <Sparkles className="h-5 w-5 text-violet-500" />
          </div>
          <div>
            <p className="font-medium text-foreground">{t("reviewCandidates")}</p>
            <p className="text-xs text-muted-foreground">{t("reviewCandidatesDesc")}</p>
          </div>
          <ArrowRight className="ms-auto h-5 w-5 text-muted-foreground" />
        </Link>
        <Link
          href="/dashboard/interviews"
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-accent/50"
        >
          <div className="rounded-xl bg-amber-500/10 p-2.5">
            <Video className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="font-medium text-foreground">{t("manageInterviews")}</p>
            <p className="text-xs text-muted-foreground">{t("manageInterviewsDesc")}</p>
          </div>
          <ArrowRight className="ms-auto h-5 w-5 text-muted-foreground" />
        </Link>
      </div>
    </div>
  );
}

// ─── Candidate Overview ───────────────────────────────────────────────────────

async function CandidateOverview({ userId, name }: { userId: string; name: string }) {
  const [stats, interviews] = await Promise.all([
    getCandidateStats(userId),
    getInterviewsByCandidate(userId),
  ]);
  const t = await getTranslations("dashboard");

  const pendingInterviews = interviews.filter((i) => i.status === "pending").length;

  const statCards = [
    { label: t("totalApplications"), value: stats.totalApplications, icon: FileText, color: "text-primary bg-primary/10" },
    { label: t("shortlisted"), value: stats.shortlisted, icon: Target, color: "text-amber-600 bg-amber-500/10 dark:text-amber-400" },
    { label: t("interviewInvites"), value: pendingInterviews, icon: Video, color: "text-violet-600 bg-violet-500/10 dark:text-violet-400" },
    { label: t("offersReceived"), value: stats.offered, icon: CheckCircle2, color: "text-success bg-success/10" },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-border bg-card p-5">
            <div className={`inline-flex rounded-xl p-2.5 ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div className="mt-3 text-3xl font-bold text-foreground">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Application Status Breakdown */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">{t("applicationStatus")}</h2>
          {stats.totalApplications === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              {t("noApplicationsYet")}
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { key: "applied", count: stats.statusCounts["applied"] ?? 0, color: "bg-muted-foreground" },
                { key: "reviewed", count: stats.statusCounts["reviewed"] ?? 0, color: "bg-blue-500" },
                { key: "shortlisted", count: stats.shortlisted, color: "bg-amber-500" },
                { key: "interview", count: stats.interviewing, color: "bg-violet-500" },
                { key: "offered", count: stats.offered, color: "bg-emerald-500" },
                { key: "rejected", count: stats.rejected, color: "bg-error" },
              ].map((step) => {
                const width = Math.max((step.count / Math.max(stats.totalApplications, 1)) * 100, 4);
                return (
                  <div key={step.key} className="flex items-center gap-3">
                    <span className="w-24 text-sm text-muted-foreground">{t(step.key)}</span>
                    <div className="flex-1">
                      <div className="h-5 overflow-hidden rounded-lg bg-accent">
                        <div
                          className={`h-full rounded-lg ${step.color} transition-all`}
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-8 text-end text-sm font-medium text-foreground">{step.count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pending Interviews */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">{t("upcomingInterviews")}</h2>
            <Link href="/dashboard/interviews" className="text-sm text-primary hover:underline">
              {t("viewAll")} →
            </Link>
          </div>
          {interviews.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              {t("noInterviewsYet")}
            </div>
          ) : (
            <div className="space-y-3">
              {interviews.slice(0, 5).map((interview) => (
                <Link
                  key={interview.id}
                  href={`/dashboard/interviews/${interview.id}`}
                  className="flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-accent/50"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{interview.job.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {(interview.questions as unknown[]).length} questions
                    </p>
                  </div>
                  <span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-600 dark:text-violet-400">
                    {interview.status === "pending" ? t("startNow") : interview.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/dashboard/jobs"
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-accent/50"
        >
          <div className="rounded-xl bg-primary/10 p-2.5">
            <Briefcase className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">{t("browseJobs")}</p>
            <p className="text-xs text-muted-foreground">{t("browseJobsDesc")}</p>
          </div>
          <ArrowRight className="ms-auto h-5 w-5 text-muted-foreground" />
        </Link>
        <Link
          href="/dashboard/applications"
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-accent/50"
        >
          <div className="rounded-xl bg-violet-500/10 p-2.5">
            <FileText className="h-5 w-5 text-violet-500" />
          </div>
          <div>
            <p className="font-medium text-foreground">{t("trackApplications")}</p>
            <p className="text-xs text-muted-foreground">{t("trackApplicationsDesc")}</p>
          </div>
          <ArrowRight className="ms-auto h-5 w-5 text-muted-foreground" />
        </Link>
      </div>
    </div>
  );
}
