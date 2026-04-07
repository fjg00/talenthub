"use client";

import { useTranslations } from "next-intl";

const jobStatusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-success/10 text-success",
  closed: "bg-error/10 text-error",
};

const applicationStatusColors: Record<string, string> = {
  applied: "bg-primary/10 text-primary",
  reviewed: "bg-warning/10 text-warning",
  shortlisted: "bg-success/10 text-success",
  interview: "bg-primary/10 text-primary",
  offered: "bg-success/10 text-success",
  rejected: "bg-error/10 text-error",
  hired: "bg-success/10 text-success",
};

export function JobStatusBadge({ status }: { status: string }) {
  const t = useTranslations("jobs");
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${jobStatusColors[status] ?? "bg-muted text-muted-foreground"}`}
    >
      {t(status)}
    </span>
  );
}

export function ApplicationStatusBadge({ status }: { status: string }) {
  const t = useTranslations("applications");
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${applicationStatusColors[status] ?? "bg-muted text-muted-foreground"}`}
    >
      {t(status)}
    </span>
  );
}
