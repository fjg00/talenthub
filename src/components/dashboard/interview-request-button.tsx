"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Video, Loader2, CheckCircle } from "lucide-react";
import { createInterviewAction } from "@/lib/actions/interviews";

interface InterviewRequestButtonProps {
  jobId: string;
  candidateId: string;
  existingInterviewId?: string | null;
}

export function InterviewRequestButton({
  jobId,
  candidateId,
  existingInterviewId,
}: InterviewRequestButtonProps) {
  const t = useTranslations("interview");
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(!!existingInterviewId);

  function handleRequest() {
    startTransition(async () => {
      const res = await createInterviewAction(jobId, candidateId);
      if (res.success) setSent(true);
    });
  }

  if (sent) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-success">
        <CheckCircle className="h-3.5 w-3.5" />
        {t("interviewSent")}
      </span>
    );
  }

  return (
    <button
      onClick={handleRequest}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-500/10 to-purple-500/10 px-3 py-1.5 text-xs font-medium text-violet-600 transition-colors hover:from-violet-500/20 hover:to-purple-500/20 disabled:opacity-50 dark:text-violet-400"
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Video className="h-3.5 w-3.5" />
      )}
      {t("requestInterview")}
    </button>
  );
}
