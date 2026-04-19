"use client";

import { useState, useTransition } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { Link } from "@/i18n/navigation";
import { EyeOff, Trash2, ExternalLink, Check, X } from "lucide-react";
import {
  adminDeleteJobAction,
  adminUnpublishJobAction,
} from "@/lib/actions/admin";

export type AdminJob = {
  id: string;
  title: string;
  status: "draft" | "published" | "closed";
  createdAt: Date;
  views: number | null;
  employerId: string;
  employerName: string | null;
  companyName: string | null;
  applicants: number;
};

export function AdminJobRow({ job }: { job: AdminJob }) {
  const t = useTranslations("admin");
  const fmt = useFormatter();
  const [pending, start] = useTransition();
  const [confirmAction, setConfirmAction] = useState<"unpublish" | "delete" | null>(null);

  const statusColor =
    job.status === "published"
      ? "bg-success/10 text-success"
      : job.status === "draft"
        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
        : "bg-muted text-muted-foreground";

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-3">
        <Link
          href={`/jobs/${job.id}`}
          className="inline-flex items-center gap-1 font-medium text-foreground hover:text-primary"
        >
          {job.title}
          <ExternalLink className="h-3 w-3" />
        </Link>
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {job.companyName ?? job.employerName ?? "—"}
      </td>
      <td className="px-4 py-3">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor}`}>
          {t(job.status)}
        </span>
      </td>
      <td className="px-4 py-3 text-foreground">{job.applicants}</td>
      <td className="px-4 py-3 text-muted-foreground">
        {fmt.dateTime(new Date(job.createdAt), { dateStyle: "medium" })}
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-2">
          {confirmAction === null && job.status === "published" && (
            <button
              disabled={pending}
              onClick={() => setConfirmAction("unpublish")}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs hover:bg-accent disabled:opacity-60"
            >
              <EyeOff className="h-3.5 w-3.5" />
              {t("unpublish")}
            </button>
          )}
          {confirmAction === null && (
            <button
              disabled={pending}
              onClick={() => setConfirmAction("delete")}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-error hover:bg-error/5 disabled:opacity-60"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t("delete")}
            </button>
          )}
          {confirmAction !== null && (
            <div
              role="group"
              aria-label={
                confirmAction === "delete" ? t("deleteJobConfirm") : t("unpublishConfirm")
              }
              className={`inline-flex items-center gap-1 rounded-lg border px-1.5 py-0.5 text-xs ${
                confirmAction === "delete"
                  ? "border-error/30 bg-error/5"
                  : "border-amber-500/30 bg-amber-500/5"
              }`}
            >
              <span className="px-1 text-foreground">
                {confirmAction === "delete" ? t("deleteJobConfirm") : t("unpublishConfirm")}
              </span>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    if (confirmAction === "delete") {
                      await adminDeleteJobAction(job.id);
                    } else {
                      await adminUnpublishJobAction(job.id);
                    }
                    setConfirmAction(null);
                  })
                }
                aria-label={t("confirm")}
                className={`inline-flex items-center rounded px-1.5 py-0.5 text-white disabled:opacity-60 ${
                  confirmAction === "delete"
                    ? "bg-error hover:bg-error/90"
                    : "bg-amber-500 hover:bg-amber-600"
                }`}
              >
                <Check className="h-3 w-3" />
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => setConfirmAction(null)}
                aria-label={t("cancel")}
                className="inline-flex items-center rounded border border-border bg-background px-1.5 py-0.5 hover:bg-accent disabled:opacity-60"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
