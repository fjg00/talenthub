"use client";

import { useActionState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Upload, FileText, Loader2, CheckCircle } from "lucide-react";
import { uploadCvAction, type CvUploadState } from "@/lib/actions/cv-upload";

interface CvUploadProps {
  currentCvUrl: string | null;
}

export function CvUpload({ currentCvUrl }: CvUploadProps) {
  const t = useTranslations("profile");
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState<CvUploadState, FormData>(
    uploadCvAction,
    {}
  );

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="mb-2 text-lg font-semibold text-foreground">
        {t("cvUpload")}
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">{t("cvUploadDesc")}</p>

      {state.success && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-success/20 bg-success/10 p-3 text-sm text-success">
          <CheckCircle className="h-4 w-4" />
          {t("cvUploaded")}
        </div>
      )}

      {state.error && (
        <div className="mb-4 rounded-xl border border-error/20 bg-error/10 p-3 text-sm text-error">
          {state.error}
        </div>
      )}

      {currentCvUrl && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-accent/50 p-3 text-sm">
          <FileText className="h-4 w-4 text-primary" />
          <span className="text-foreground">
            {currentCvUrl.split("/").pop()}
          </span>
        </div>
      )}

      <form ref={formRef} action={formAction}>
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-6 transition-colors hover:border-primary hover:bg-accent/30">
          {isPending ? (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          ) : (
            <Upload className="h-8 w-8 text-muted-foreground" />
          )}
          <span className="text-sm font-medium text-foreground">
            {isPending
              ? t("cvUploading")
              : currentCvUrl
                ? t("cvReplace")
                : t("cvUpload")}
          </span>
          <input
            name="cv"
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            disabled={isPending}
            onChange={() => formRef.current?.requestSubmit()}
          />
        </label>
      </form>
    </div>
  );
}
