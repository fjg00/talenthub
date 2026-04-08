"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { Briefcase, Users, Plus, Trash2, Eye } from "lucide-react";
import { JobStatusBadge } from "./status-badge";
import { formatViews } from "@/lib/utils/format-views";
import { toggleJobStatusAction, deleteJobAction } from "@/lib/actions/jobs";
import { useTransition } from "react";

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

export function EmployerJobList({ jobs }: { jobs: Job[] }) {
  const t = useTranslations("jobs");

  if (jobs.length === 0) {
    return (
      <div className="text-center py-16">
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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t("myJobs")}</h1>
        <Link
          href="/dashboard/jobs/new"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          {t("postJob")}
        </Link>
      </div>

      <div className="space-y-4">
        {jobs.map((job, i) => (
          <JobCard key={job.id} job={job} index={i} />
        ))}
      </div>
    </div>
  );
}

function JobCard({ job, index }: { job: Job & { applications: { id: string }[] }; index: number }) {
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
              {new Date(job.createdAt).toLocaleDateString()}
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
          {job.status === "draft" && (
            <button
              disabled={isPending}
              onClick={() =>
                startTransition(async () => { await toggleJobStatusAction(job.id, "published"); })
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
                startTransition(async () => { await toggleJobStatusAction(job.id, "closed"); })
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
          <button
            disabled={isPending}
            onClick={() => {
              if (confirm(t("deleteConfirm"))) {
                startTransition(async () => { await deleteJobAction(job.id); });
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
