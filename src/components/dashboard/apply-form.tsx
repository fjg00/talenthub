"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, CheckCircle } from "lucide-react";
import {
  applyToJobAction,
  type ApplicationState,
} from "@/lib/actions/applications";

interface ApplyFormProps {
  jobId: string;
  hasApplied: boolean;
}

export function ApplyForm({ jobId, hasApplied }: ApplyFormProps) {
  const t = useTranslations("applications");
  const tj = useTranslations("jobs");

  const [state, formAction, isPending] = useActionState<
    ApplicationState,
    FormData
  >(applyToJobAction, {});

  if (hasApplied || state.success) {
    return (
      <div className="rounded-2xl border border-success/20 bg-success/10 p-6 text-center">
        <CheckCircle className="mx-auto h-8 w-8 text-success" />
        <p className="mt-2 font-medium text-success">
          {state.success ? t("success") : tj("applied")}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="mb-4 text-lg font-semibold text-foreground">
        {tj("apply")}
      </h3>

      {state.error && (
        <div className="mb-4 rounded-xl border border-error/20 bg-error/10 p-3 text-sm text-error">
          {t(state.error)}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="jobId" value={jobId} />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {t("coverLetter")}
          </label>
          <textarea
            name="coverLetter"
            rows={5}
            placeholder={t("coverLetterPlaceholder")}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isPending ? t("submitting") : t("submit")}
        </button>
      </form>
    </div>
  );
}
