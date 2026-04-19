"use client";

import { useState, useMemo, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { Briefcase, Users, Plus, Trash2, Eye, Archive, RotateCcw, Download } from "lucide-react";
import { JobStatusBadge } from "./status-badge";
import { formatViews } from "@/lib/utils/format-views";
import { toggleJobStatusAction, deleteJobAction } from "@/lib/actions/jobs";

interface Job {
  id: string;
  title: string;
  location: string | null;
  jobType: string | null;
  views: number;
  status: string;
  createdAt: Date;
  applications: { id: string }[];
}

type SortKey = "date" | "applicants" | "views";

export function EmployerJobList({ jobs }: { jobs: Job[] }) {
  const t = useTranslations("jobs");
  const [tab, setTab] = useState<"active" | "archived">("active");
  const [sortBy, setSortBy] = useState<SortKey>("date");

  const activeJobs = useMemo(
    () => jobs.filter((j) => j.status === "draft" || j.status === "published"),
    [jobs]
  );
  const archivedJobs = useMemo(
    () => jobs.filter((j) => j.status === "closed"),
    [jobs]
  );

  const currentJobs = tab === "active" ? activeJobs : archivedJobs;

  const sorted = useMemo(() => {
    const list = [...currentJobs];
    switch (sortBy) {
      case "applicants":
        list.sort((a, b) => b.applications.length - a.applications.length);
        break;
      case "views":
        list.sort((a, b) => b.views - a.views);
        break;
      default:
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return list;
  }, [currentJobs, sortBy]);

  if (jobs.length === 0) {
    return (
      <div className="py-16 text-center">
        <Briefcase className="mx-auto h-12 w-12 text-muted-foreground/30" />
        <h2 className="mt-4 text-lg font-semibold text-foreground">{t("noJobs")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("noJobsDesc")}</p>
        <Link
          href="/dashboard/jobs/new"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          {t("postJob")}
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t("myJobs")}</h1>
        <div className="flex items-center gap-2">
          <a
            href="/api/export/jobs"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
          >
            <Download className="h-4 w-4" />
            {t("exportCsv")}
          </a>
          <Link
            href="/dashboard/jobs/new"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            {t("postJob")}
          </Link>
        </div>
      </div>

      {/* Tabs + Sort */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-1 rounded-xl bg-accent p-1">
          <button
            onClick={() => setTab("active")}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === "active"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("activeJobs")} ({activeJobs.length})
          </button>
          <button
            onClick={() => setTab("archived")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === "archived"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Archive className="h-3.5 w-3.5" />
            {t("archivedJobs")} ({archivedJobs.length})
          </button>
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
        >
          <option value="date">{t("sortByDate")}</option>
          <option value="applicants">{t("sortByApplicants")}</option>
          <option value="views">{t("sortByViews")}</option>
        </select>
      </div>

      {/* Job cards */}
      {sorted.length === 0 ? (
        <div className="py-12 text-center">
          <Archive className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <p className="mt-2 text-sm text-muted-foreground">
            {tab === "archived" ? t("noArchivedJobs") : t("noJobs")}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((job, i) => (
            <JobCard key={job.id} job={job} index={i} isArchived={tab === "archived"} />
          ))}
        </div>
      )}
    </div>
  );
}

function JobCard({
  job,
  index,
  isArchived,
}: {
  job: Job;
  index: number;
  isArchived: boolean;
}) {
  const t = useTranslations("jobs");
  const [isPending, startTransition] = useTransition();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-2xl border border-border bg-card p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/jobs/${job.id}`}
              className="text-lg font-semibold text-foreground hover:text-primary"
            >
              {job.title}
            </Link>
            <JobStatusBadge status={job.status} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {job.location && <span>{job.location}</span>}
            {job.jobType && <span>{t(job.jobType)}</span>}
            <span>
              {t("postedOn")}{" "}
              {new Date(job.createdAt).toLocaleDateString("en-CA")}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {formatViews(job.views)} {t("views")}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {job.applications.length} {t("applicants")}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isArchived ? (
            <button
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await toggleJobStatusAction(job.id, "published");
                })
              }
              className="flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
            >
              <RotateCcw className="h-3 w-3" />
              {t("reopen")}
            </button>
          ) : (
            <>
              {job.status === "draft" && (
                <button
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      await toggleJobStatusAction(job.id, "published");
                    })
                  }
                  className="rounded-lg bg-success/10 px-3 py-1.5 text-xs font-medium text-success transition-colors hover:bg-success/20 disabled:opacity-50"
                >
                  {t("publish")}
                </button>
              )}
              {job.status === "published" && (
                <button
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      await toggleJobStatusAction(job.id, "closed");
                    })
                  }
                  className="rounded-lg bg-warning/10 px-3 py-1.5 text-xs font-medium text-warning transition-colors hover:bg-warning/20 disabled:opacity-50"
                >
                  {t("close")}
                </button>
              )}
              <Link
                href={`/dashboard/jobs/${job.id}/edit`}
                className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent/80"
              >
                {t("editJob")}
              </Link>
            </>
          )}
          <button
            disabled={isPending}
            onClick={() => {
              if (confirm(t("deleteConfirm"))) {
                startTransition(async () => {
                  await deleteJobAction(job.id);
                });
              }
            }}
            className="rounded-lg p-1.5 text-error transition-colors hover:bg-error/10 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
