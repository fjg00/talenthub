import { getTranslations } from "next-intl/server";
import { Users, Briefcase, FileText, Video, TrendingUp } from "lucide-react";
import { getAdminStats, getAdminGrowth } from "@/lib/dal/admin";

export default async function AdminOverviewPage() {
  const t = await getTranslations("admin");
  const [stats, growth] = await Promise.all([getAdminStats(), getAdminGrowth()]);

  const kpis = [
    {
      icon: Users,
      label: t("totalUsers"),
      value: stats.totalUsers,
      delta: stats.usersLast30Days,
      color: "bg-primary/10 text-primary",
    },
    {
      icon: Briefcase,
      label: t("totalJobs"),
      value: stats.totalJobs,
      delta: stats.jobsLast30Days,
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      icon: FileText,
      label: t("totalApplications"),
      value: stats.totalApplications,
      delta: stats.applicationsLast30Days,
      color: "bg-success/10 text-success",
    },
    {
      icon: Video,
      label: t("totalInterviews"),
      value: stats.totalInterviews,
      color: "bg-violet-500/10 text-violet-500",
    },
  ];

  const maxUsers = Math.max(...growth.map((g) => g.users), 1);
  const maxJobs = Math.max(...growth.map((g) => g.jobs), 1);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-foreground">{t("overview")}</h1>

      {/* Breakdown */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <div className={`inline-flex rounded-xl p-2.5 ${k.color}`}>
              <k.icon className="h-5 w-5" />
            </div>
            <div className="mt-3 text-3xl font-bold text-foreground">
              {k.value.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">{k.label}</div>
            {k.delta !== undefined && (
              <div className="mt-1 inline-flex items-center gap-1 text-xs text-success">
                <TrendingUp className="h-3 w-3" />+{k.delta} {t("last30Days")}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Role breakdown */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-sm text-muted-foreground">{t("candidates")}</div>
          <div className="mt-1 text-2xl font-bold text-foreground">
            {stats.totalCandidates.toLocaleString()}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-sm text-muted-foreground">{t("employers")}</div>
          <div className="mt-1 text-2xl font-bold text-foreground">
            {stats.totalEmployers.toLocaleString()}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-sm text-muted-foreground">{t("publishedJobs")}</div>
          <div className="mt-1 text-2xl font-bold text-foreground">
            {stats.publishedJobs.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Growth */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            {t("userGrowth")}
          </h2>
          <div className="flex h-32 items-end gap-1">
            {growth.map((g) => (
              <div
                key={g.date}
                className="flex-1 rounded-t bg-primary/70 hover:bg-primary"
                style={{ height: `${Math.max((g.users / maxUsers) * 100, 2)}%` }}
                title={`${g.date}: ${g.users} signups`}
              />
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            {t("jobGrowth")}
          </h2>
          <div className="flex h-32 items-end gap-1">
            {growth.map((g) => (
              <div
                key={g.date}
                className="flex-1 rounded-t bg-blue-500/70 hover:bg-blue-500"
                style={{ height: `${Math.max((g.jobs / maxJobs) * 100, 2)}%` }}
                title={`${g.date}: ${g.jobs} jobs`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
