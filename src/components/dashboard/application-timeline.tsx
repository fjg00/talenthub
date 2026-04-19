"use client";

import { useTranslations } from "next-intl";
import {
  FileText,
  Eye,
  Star,
  MessageSquare,
  Gift,
  XCircle,
  CheckCircle2,
  Circle,
} from "lucide-react";

export type TimelineEntry = {
  id: string;
  status: string;
  note: string | null;
  createdAt: Date | string;
};

// Canonical pipeline order. "rejected" is terminal and rendered only if present.
const PIPELINE: readonly string[] = [
  "applied",
  "reviewed",
  "shortlisted",
  "interview",
  "offered",
  "hired",
];

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  applied: FileText,
  reviewed: Eye,
  shortlisted: Star,
  interview: MessageSquare,
  offered: Gift,
  hired: CheckCircle2,
  rejected: XCircle,
};

const COLORS: Record<string, string> = {
  applied: "text-muted-foreground",
  reviewed: "text-blue-500",
  shortlisted: "text-amber-500",
  interview: "text-purple-500",
  offered: "text-emerald-500",
  hired: "text-success",
  rejected: "text-error",
};

export function ApplicationTimeline({
  entries,
  currentStatus,
}: {
  entries: TimelineEntry[];
  currentStatus: string;
}) {
  const t = useTranslations("applications");

  // Map of status → most recent history entry (in case of repeated transitions we take the latest)
  const statusDates = new Map<string, Date>();
  for (const e of entries) {
    statusDates.set(e.status, new Date(e.createdAt));
  }

  const isRejected = currentStatus === "rejected";
  const currentIdx = PIPELINE.indexOf(currentStatus);

  // Build visible steps
  const steps = isRejected
    ? (() => {
        // Find the highest positive step reached before rejection
        const reached = PIPELINE.filter((s) => statusDates.has(s));
        const base = reached.length > 0 ? reached : ["applied"];
        return [...base, "rejected"];
      })()
    : PIPELINE;

  return (
    <ol className="space-y-3">
      {steps.map((step) => {
        const reached = statusDates.has(step);
        const Icon = ICONS[step] ?? Circle;
        const color = reached ? COLORS[step] : "text-muted-foreground/40";
        const date = statusDates.get(step);
        const isCurrent = step === currentStatus;

        return (
          <li key={step} className="flex items-start gap-3">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                reached
                  ? "border-border bg-card"
                  : "border-dashed border-muted-foreground/20 bg-transparent"
              }`}
            >
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-center gap-2 text-sm">
                <span
                  className={
                    reached
                      ? "font-medium text-foreground"
                      : "text-muted-foreground/60"
                  }
                >
                  {t(step as "applied" | "reviewed" | "shortlisted" | "interview" | "offered" | "rejected" | "hired")}
                </span>
                {isCurrent && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                    {t("current")}
                  </span>
                )}
              </div>
              {date && (
                <div className="text-xs text-muted-foreground">
                  {date.toLocaleDateString("en-CA")}{" "}
                  {date.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
