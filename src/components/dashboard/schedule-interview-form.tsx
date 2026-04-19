"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Calendar, Video, Phone, MapPin, X } from "lucide-react";
import { createScheduleAction } from "@/lib/actions/interview-schedules";

type Props = {
  applicationId: string;
  candidateName: string;
  onClose?: () => void;
};

export function ScheduleInterviewForm({
  applicationId,
  candidateName,
  onClose,
}: Props) {
  const t = useTranslations("interviewSchedule");
  const [type, setType] = useState<"video" | "phone" | "onsite">("video");
  const [state, action, pending] = useActionState(createScheduleAction, {});

  // Default scheduledAt to 1 hour from now, rounded up to nearest 15 min
  const now = new Date();
  now.setMinutes(now.getMinutes() + 60);
  now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15);
  const defaultLocal = now.toISOString().slice(0, 16);

  return (
    <form
      action={action}
      className="rounded-2xl border border-border bg-card p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">{t("scheduleWith", { name: candidateName })}</h3>
          <p className="text-xs text-muted-foreground">{t("scheduleDesc")}</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-accent"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <input type="hidden" name="applicationId" value={applicationId} />

      {/* Type selector */}
      <div className="grid grid-cols-3 gap-2">
        {([
          { value: "video", icon: Video, label: t("video") },
          { value: "phone", icon: Phone, label: t("phone") },
          { value: "onsite", icon: MapPin, label: t("onsite") },
        ] as const).map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setType(value)}
            className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${
              type === value
                ? "border-primary bg-primary/5 text-primary"
                : "border-border bg-background text-muted-foreground hover:border-primary/40"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
        <input type="hidden" name="type" value={type} />
      </div>

      {/* Date + duration */}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">
            {t("when")}
          </span>
          <input
            type="datetime-local"
            name="scheduledAt"
            required
            defaultValue={defaultLocal}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">
            {t("duration")}
          </span>
          <select
            name="durationMinutes"
            defaultValue="30"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="15">15 min</option>
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="60">60 min</option>
            <option value="90">90 min</option>
            <option value="120">120 min</option>
          </select>
        </label>
      </div>

      {/* Conditional: meeting URL / location */}
      {type === "video" && (
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">
            {t("meetingUrl")}
          </span>
          <input
            type="url"
            name="meetingUrl"
            placeholder="https://meet.google.com/..."
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </label>
      )}
      {type === "onsite" && (
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">
            {t("location")}
          </span>
          <input
            type="text"
            name="location"
            placeholder={t("locationPlaceholder")}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </label>
      )}

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted-foreground">
          {t("notes")}
        </span>
        <textarea
          name="notes"
          rows={3}
          placeholder={t("notesPlaceholder")}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      </label>

      {state.error && (
        <p className="text-sm text-error">{state.error}</p>
      )}
      {state.success && (
        <p className="text-sm text-success">{t("scheduledSuccess")}</p>
      )}

      <div className="flex items-center justify-end gap-2 pt-2">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            {t("cancel")}
          </button>
        )}
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          <Calendar className="h-4 w-4" />
          {pending ? t("scheduling") : t("schedule")}
        </button>
      </div>
    </form>
  );
}
