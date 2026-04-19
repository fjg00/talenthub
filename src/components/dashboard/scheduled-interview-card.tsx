"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  Video,
  Phone,
  MapPin,
  Calendar,
  Clock,
  X,
  Check,
  ExternalLink,
} from "lucide-react";
import {
  cancelScheduleAction,
  completeScheduleAction,
} from "@/lib/actions/interview-schedules";

export type ScheduledInterviewCardItem = {
  id: string;
  scheduledAt: Date;
  durationMinutes: number;
  type: "video" | "phone" | "onsite";
  status: "scheduled" | "completed" | "cancelled" | "rescheduled";
  location: string | null;
  meetingUrl: string | null;
  notes: string | null;
  subtitle: string;
  heading: string;
};

export function ScheduledInterviewCard({
  item,
  canManage,
}: {
  item: ScheduledInterviewCardItem;
  canManage: boolean;
}) {
  const t = useTranslations("interviewSchedule");
  const [pending, start] = useTransition();

  const TypeIcon =
    item.type === "video" ? Video : item.type === "phone" ? Phone : MapPin;

  const statusColor =
    item.status === "scheduled"
      ? "bg-primary/10 text-primary"
      : item.status === "completed"
        ? "bg-success/10 text-success"
        : item.status === "cancelled"
          ? "bg-error/10 text-error"
          : "bg-amber-500/10 text-amber-600 dark:text-amber-400";

  const when = new Date(item.scheduledAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <TypeIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground truncate">
              {item.heading}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {item.subtitle}
            </p>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {when}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {item.durationMinutes} min
              </span>
              <span className="capitalize">{t(item.type)}</span>
            </div>
            {item.type === "video" && item.meetingUrl && (
              <a
                href={item.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {t("joinLink")}
              </a>
            )}
            {item.type === "onsite" && item.location && (
              <p className="mt-2 text-sm text-foreground">{item.location}</p>
            )}
            {item.notes && (
              <p className="mt-2 text-sm text-muted-foreground italic">
                {item.notes}
              </p>
            )}
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusColor}`}
        >
          {t(`status_${item.status}`)}
        </span>
      </div>

      {canManage && item.status === "scheduled" && (
        <div className="mt-4 flex gap-2 border-t border-border pt-3">
          <button
            disabled={pending}
            onClick={() =>
              start(async () => {
                await completeScheduleAction(item.id);
              })
            }
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent disabled:opacity-60"
          >
            <Check className="h-3.5 w-3.5" />
            {t("markCompleted")}
          </button>
          <button
            disabled={pending}
            onClick={() =>
              start(async () => {
                if (!confirm(t("cancelConfirm"))) return;
                await cancelScheduleAction(item.id);
              })
            }
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-error hover:bg-error/5 disabled:opacity-60"
          >
            <X className="h-3.5 w-3.5" />
            {t("cancelInterview")}
          </button>
        </div>
      )}
    </div>
  );
}
