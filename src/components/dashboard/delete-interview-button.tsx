"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Trash2, Loader2, AlertCircle } from "lucide-react";
import { deleteInterviewAction } from "@/lib/actions/interviews";

interface DeleteInterviewButtonProps {
  interviewId: string;
  hasResponses: boolean;
}

export function DeleteInterviewButton({
  interviewId,
  hasResponses,
}: DeleteInterviewButtonProps) {
  const t = useTranslations("interview");
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const res = await deleteInterviewAction(interviewId);
      if (res.error) {
        setError(t(res.error));
        return;
      }
      router.push("/dashboard/interviews");
    });
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-error/30 hover:bg-error/5 hover:text-error"
      >
        <Trash2 className="h-3.5 w-3.5" />
        {t("deleteInterview")}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-error/20 bg-error/5 p-3">
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-error" />
        <div className="flex-1 text-sm">
          <p className="font-medium text-foreground">
            {t("deleteConfirmTitle")}
          </p>
          <p className="mt-0.5 text-muted-foreground">
            {hasResponses ? t("deleteConfirmDescWithData") : t("deleteConfirmDesc")}
          </p>
          {error && (
            <p role="alert" className="mt-2 text-error">
              {error}
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-error px-3 py-1 text-xs font-medium text-white hover:bg-error/90 disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              {t("deleteConfirm")}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={isPending}
              className="rounded-lg border border-border bg-background px-3 py-1 text-xs font-medium text-foreground hover:bg-accent disabled:opacity-50"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
