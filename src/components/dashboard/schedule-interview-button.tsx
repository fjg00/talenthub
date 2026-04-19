"use client";

import { useState } from "react";
import { CalendarPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { ScheduleInterviewForm } from "./schedule-interview-form";

export function ScheduleInterviewButton({
  applicationId,
  candidateName,
}: {
  applicationId: string;
  candidateName: string;
}) {
  const t = useTranslations("interviewSchedule");
  const [open, setOpen] = useState(false);

  if (open) {
    return (
      <div className="col-span-full mt-3">
        <ScheduleInterviewForm
          applicationId={applicationId}
          candidateName={candidateName}
          onClose={() => setOpen(false)}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
    >
      <CalendarPlus className="h-3.5 w-3.5" />
      {t("scheduleInterview")}
    </button>
  );
}
