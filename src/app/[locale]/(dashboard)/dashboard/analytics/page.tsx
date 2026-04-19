import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/dal/profiles";
import { getEmployerStats } from "@/lib/dal/applications";
import { getJobsByEmployer } from "@/lib/dal/jobs";
import { getInterviewsByEmployer } from "@/lib/dal/interviews";
import { getPipelineAnalytics } from "@/lib/dal/pipeline-analytics";
import { getTranslations } from "next-intl/server";
import {
  Users,
  Video,
  TrendingUp,
  Target,
  Clock,
  Eye,
  TrendingDown,
  CalendarDays,
} from "lucide-react";
import { formatViews } from "@/lib/utils/format-views";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  if (!profile || profile.role !== "employer") redirect("/dashboard");

  const [stats, employerJobs, interviews, pipeline] = await Promise.all([
    getEmployerStats(user.id),
    getJobsByEmployer(user.id),
    getInterviewsByEmployer(user.id),
    getPipelineAnalytics(user.id),
  ]);
  const t = await getTranslations("analytics");

  const evaluatedInterviews = interviews.filter((i) => i.status === "evaluated");
  const avgInterviewScore =
    evaluatedInterviews.length > 0
      ? Math.round(
          evaluatedInterviews.reduce((sum, i) => sum + (i.overallScore ?? 0), 0) /
            evaluatedInterviews.length
        )
      : 0;

  const totalViews = employerJobs.reduce((sum, j) => sum + (j.views ?? 0), 0);

  const hireRate =
    stats.totalApplicants > 0
      ? Math.round((stats.hired / stats.totalApplicants) * 100)
      : 0;

  const funnelSteps = [
    { label: t("applied"), count: stats.pending, color: "bg-slate-400" },
    { label: t("reviewed"), count: stats.reviewed, color: "bg-blue-500" },
    { label: t("shortlisted"), count: stats.shortlisted, color: "bg-amber-500" },
    { label: t("interviewing"), count: stats.interviewing, color: "bg-violet-500" },
    { label: t("offered"), count: stats.offered, color: "bg-emerald-500" },
    { label: t("hired"), count: stats.hired, color: "bg-success" },
    { label: t("rejected"), count: stats.rejected, color: "bg-error" },
  ];

  // Per-job breakdown
  const jobStats = employerJobs.map((job) => ({
    title: job.title,
    status: job.status,
    views: job.views ?? 0,
    applicants: job.applications.length,
    statusBreakdown: job.applications.reduce(
      (acc, app) => {
        acc[app.status] = (acc[app.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
  }));

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>

      {/* Top-level KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="inline-flex rounded-xl bg-blue-500/10 p-2.5">
            <Eye className="h-5 w-5 text-blue-500" />
          </div>
          <div className="mt-3 text-3xl font-bold text-foreground">
            {formatViews(totalViews)}
          </div>
          <div className="text-sm text-muted-foreground">{t("totalViews")}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="inline-flex rounded-xl bg-primary/10 p-2.5">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-3 text-3xl font-bold text-foreground">
            {stats.totalApplicants}
          </div>
          <div className="text-sm text-muted-foreground">{t("totalApplicants")}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="inline-flex rounded-xl bg-success/10 p-2.5">
            <TrendingUp className="h-5 w-5 text-success" />
          </div>
          <div className="mt-3 text-3xl font-bold text-foreground">{hireRate}%</div>
          <div className="text-sm text-muted-foreground">{t("hireRate")}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="inline-flex rounded-xl bg-violet-500/10 p-2.5">
            <Video className="h-5 w-5 text-violet-500" />
          </div>
          <div className="mt-3 text-3xl font-bold text-foreground">
            {evaluatedInterviews.length}
          </div>
          <div className="text-sm text-muted-foreground">{t("completedInterviews")}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="inline-flex rounded-xl bg-amber-500/10 p-2.5">
            <Target className="h-5 w-5 text-amber-500" />
          </div>
          <div className="mt-3 text-3xl font-bold text-foreground">
            {avgInterviewScore > 0 ? `${avgInterviewScore}%` : "—"}
          </div>
          <div className="text-sm text-muted-foreground">{t("avgInterviewScore")}</div>
        </div>
      </div>

      {/* Hiring Funnel */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-5 text-lg font-semibold text-foreground">
          {t("hiringFunnel")}
        </h2>
        <div className="space-y-3">
          {funnelSteps.map((step) => {
            const maxCount = Math.max(...funnelSteps.map((s) => s.count), 1);
            const pct = Math.max((step.count / maxCount) * 100, 3);
            const totalPct =
              stats.totalApplicants > 0
                ? Math.round((step.count / stats.totalApplicants) * 100)
                : 0;
            return (
              <div key={step.label} className="flex items-center gap-3">
                <span className="w-28 text-sm text-muted-foreground">
                  {step.label}
                </span>
                <div className="flex-1">
                  <div className="h-8 overflow-hidden rounded-lg bg-accent">
                    <div
                      className={`flex h-full items-center rounded-lg ${step.color} px-2 transition-all`}
                      style={{ width: `${pct}%` }}
                    >
                      {step.count > 0 && (
                        <span className="text-xs font-medium text-white">
                          {step.count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="w-12 text-end text-sm text-muted-foreground">
                  {totalPct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pipeline Conversion Funnel */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-1 text-lg font-semibold text-foreground">
          {t("conversionFunnel")}
        </h2>
        <p className="mb-5 text-sm text-muted-foreground">
          {t("conversionFunnelDesc")}
        </p>
        <div className="space-y-2">
          {pipeline.stageFunnel.map((step, i) => {
            const prev = i > 0 ? pipeline.stageFunnel[i - 1] : null;
            const dropoff =
              prev && prev.reached > 0
                ? Math.round(((prev.reached - step.reached) / prev.reached) * 100)
                : 0;
            return (
              <div key={step.stage} className="flex items-center gap-3">
                <span className="w-28 text-sm capitalize text-muted-foreground">
                  {t(step.stage as "applied")}
                </span>
                <div className="flex-1">
                  <div className="h-7 overflow-hidden rounded-lg bg-accent">
                    <div
                      className="flex h-full items-center rounded-lg bg-primary px-2"
                      style={{ width: `${Math.max(step.rate * 100, 3)}%` }}
                    >
                      {step.reached > 0 && (
                        <span className="text-xs font-medium text-primary-foreground">
                          {step.reached}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="w-16 text-end text-sm font-medium text-foreground">
                  {Math.round(step.rate * 100)}%
                </span>
                <span className="flex w-16 items-center justify-end gap-1 text-xs text-error">
                  {prev && dropoff > 0 ? (
                    <>
                      <TrendingDown className="h-3 w-3" />-{dropoff}%
                    </>
                  ) : (
                    "—"
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Time to Hire + Stage Durations */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="inline-flex rounded-xl bg-primary/10 p-2.5">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <h2 className="mt-3 text-lg font-semibold text-foreground">
            {t("timeToHire")}
          </h2>
          {pipeline.timeToHire.medianDays === null ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {t("timeToHireEmpty")}
            </p>
          ) : (
            <>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-foreground">
                  {pipeline.timeToHire.medianDays}
                </span>
                <span className="text-sm text-muted-foreground">
                  {t("daysMedian")}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {t("avgOverSample", {
                  avg: pipeline.timeToHire.avgDays ?? 0,
                  sample: pipeline.timeToHire.sample,
                })}
              </p>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            {t("avgStageDuration")}
          </h2>
          <div className="space-y-2">
            {pipeline.stageDurations.map((s) => (
              <div
                key={s.stage}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">{s.stage}</span>
                <span className="font-medium text-foreground">
                  {s.avgDays === null
                    ? "—"
                    : t("daysValue", { days: s.avgDays })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 30-Day Applications Trend */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-5 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            {t("applicationsTrend")}
          </h2>
        </div>
        {(() => {
          const maxCount = Math.max(...pipeline.trend.map((d) => d.count), 1);
          const total = pipeline.trend.reduce((a, b) => a + b.count, 0);
          return (
            <>
              <div className="flex items-end gap-1 h-32">
                {pipeline.trend.map((d) => (
                  <div
                    key={d.date}
                    className="flex-1 rounded-t bg-primary/70 hover:bg-primary transition-colors"
                    style={{
                      height: `${Math.max((d.count / maxCount) * 100, 2)}%`,
                    }}
                    title={`${d.date}: ${d.count}`}
                  />
                ))}
              </div>
              <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                <span>{pipeline.trend[0]?.date}</span>
                <span>
                  {t("trendTotal", { count: total })}
                </span>
                <span>{pipeline.trend[pipeline.trend.length - 1]?.date}</span>
              </div>
            </>
          );
        })()}
      </div>

      {/* Top Converting Jobs */}
      {pipeline.topConvertingJobs.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-5 text-lg font-semibold text-foreground">
            {t("topConverting")}
          </h2>
          <div className="space-y-3">
            {pipeline.topConvertingJobs.map((j) => (
              <div
                key={j.jobId}
                className="flex items-center justify-between rounded-xl border border-border p-4"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-medium text-foreground">
                    {j.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {t("hiredOutOf", { hired: j.hired, total: j.applicants })}
                  </p>
                </div>
                <div className="ml-4 flex items-center gap-1 rounded-full bg-success/10 px-3 py-1 text-sm font-semibold text-success">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {Math.round(j.conversionRate * 100)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-Job Breakdown */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-5 text-lg font-semibold text-foreground">
          {t("perJobBreakdown")}
        </h2>
        {jobStats.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noJobsYet")}</p>
        ) : (
          <div className="space-y-4">
            {jobStats.map((job, i) => (
              <div key={i} className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">{job.title}</h3>
                    <span
                      className={`text-xs ${
                        job.status === "published"
                          ? "text-success"
                          : job.status === "closed"
                            ? "text-muted-foreground"
                            : "text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Eye className="h-4 w-4" />
                      {formatViews(job.views)}
                    </span>
                    <span className="text-2xl font-bold text-foreground">
                      {job.applicants}
                    </span>
                  </div>
                </div>
                {job.applicants > 0 && (
                  <div className="mt-3 flex h-3 overflow-hidden rounded-full">
                    {Object.entries(job.statusBreakdown).map(([status, count]) => {
                      const colors: Record<string, string> = {
                        applied: "bg-slate-400",
                        reviewed: "bg-blue-500",
                        shortlisted: "bg-amber-500",
                        interview: "bg-violet-500",
                        offered: "bg-emerald-500",
                        hired: "bg-success",
                        rejected: "bg-error",
                      };
                      return (
                        <div
                          key={status}
                          className={`${colors[status] ?? "bg-accent"}`}
                          style={{
                            width: `${(count / job.applicants) * 100}%`,
                          }}
                          title={`${status}: ${count}`}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
