"use client";

import { useTranslations } from "next-intl";
import { useTransition, useState, useEffect, useRef } from "react";
import {
  CheckSquare,
  XCircle,
  Star,
  Mail,
  Loader2,
  X,
  Send,
} from "lucide-react";
import {
  bulkUpdateStatusAction,
  bulkEmailAction,
} from "@/lib/actions/bulk-applications";

interface BulkActionsToolbarProps {
  selectedIds: string[];
  onClearSelection: () => void;
  onOptimisticUpdate: (ids: string[], status: string) => void;
  onRevert: (ids: string[], previousStatuses: Map<string, string>) => void;
  applicants: { id: string; status: string }[];
}

export function BulkActionsToolbar({
  selectedIds,
  onClearSelection,
  onOptimisticUpdate,
  onRevert,
  applicants,
}: BulkActionsToolbarProps) {
  const t = useTranslations("applications");
  const [isPending, startTransition] = useTransition();
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  if (selectedIds.length === 0) return null;

  function handleBulkStatus(newStatus: string) {
    // Save previous statuses for revert
    const previousStatuses = new Map<string, string>();
    for (const id of selectedIds) {
      const app = applicants.find((a) => a.id === id);
      if (app) previousStatuses.set(id, app.status);
    }

    onOptimisticUpdate(selectedIds, newStatus);
    setResult(null);

    startTransition(async () => {
      const res = await bulkUpdateStatusAction(selectedIds, newStatus);
      if (res.error) {
        onRevert(selectedIds, previousStatuses);
        setResult({ type: "error", message: res.error });
      } else {
        setResult({
          type: "success",
          message: t("bulkSuccess", { count: res.count ?? 0 }),
        });
        onClearSelection();
      }
    });
  }

  return (
    <>
      <div className="sticky top-16 z-20 flex flex-wrap items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <CheckSquare className="h-4 w-4 text-primary" />
          {t("bulkSelected", { count: selectedIds.length })}
        </div>

        <div className="mx-2 h-5 w-px bg-border" />

        {/* Shortlist */}
        <button
          disabled={isPending}
          onClick={() => handleBulkStatus("shortlisted")}
          className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-500/20 disabled:opacity-50 dark:text-amber-400"
        >
          <Star className="h-3.5 w-3.5" />
          {t("bulkShortlist")}
        </button>

        {/* Reject */}
        <button
          disabled={isPending}
          onClick={() => handleBulkStatus("rejected")}
          className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-500/20 disabled:opacity-50 dark:text-red-400"
        >
          <XCircle className="h-3.5 w-3.5" />
          {t("bulkReject")}
        </button>

        {/* Email */}
        <button
          disabled={isPending}
          onClick={() => setShowEmailModal(true)}
          className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
        >
          <Mail className="h-3.5 w-3.5" />
          {t("bulkEmail")}
        </button>

        {/* More statuses */}
        <select
          disabled={isPending}
          value=""
          onChange={(e) => {
            if (e.target.value) handleBulkStatus(e.target.value);
          }}
          className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none disabled:opacity-50"
        >
          <option value="">{t("bulkMoreActions")}</option>
          <option value="reviewed">{t("reviewed")}</option>
          <option value="interview">{t("interview")}</option>
          <option value="offered">{t("offered")}</option>
        </select>

        <div className="flex-1" />

        {/* Clear selection */}
        <button
          onClick={onClearSelection}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
          {t("bulkClear")}
        </button>

        {isPending && (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        )}

        {result && (
          <span
            className={`text-xs font-medium ${result.type === "success" ? "text-success" : "text-red-500"}`}
          >
            {result.message}
          </span>
        )}
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <BulkEmailModal
          selectedIds={selectedIds}
          onClose={() => setShowEmailModal(false)}
          onSuccess={(count) => {
            setShowEmailModal(false);
            setResult({
              type: "success",
              message: t("bulkEmailSent", { count }),
            });
            onClearSelection();
          }}
        />
      )}
    </>
  );
}

function BulkEmailModal({
  selectedIds,
  onClose,
  onSuccess,
}: {
  selectedIds: string[];
  onClose: () => void;
  onSuccess: (count: number) => void;
}) {
  const t = useTranslations("applications");
  const [isPending, startTransition] = useTransition();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const subjectRef = useRef<HTMLInputElement>(null);

  // Autofocus + Escape-to-close + focus trap
  useEffect(() => {
    subjectRef.current?.focus();
    const prevActive = document.activeElement as HTMLElement | null;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      prevActive?.focus?.();
    };
  }, [onClose]);

  function handleSend() {
    if (!subject.trim() || !message.trim()) {
      setError(t("bulkEmailRequired"));
      return;
    }
    setError("");

    startTransition(async () => {
      const res = await bulkEmailAction(selectedIds, subject, message);
      if (res.error) {
        setError(res.error);
      } else {
        onSuccess(res.count ?? 0);
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-email-title"
        className="mx-4 w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <h3 id="bulk-email-title" className="text-lg font-semibold text-foreground">
            {t("bulkEmailTitle")}
          </h3>
          <button
            onClick={onClose}
            aria-label={t("bulkEmailCancel")}
            className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-1 text-sm text-muted-foreground">
          {t("bulkEmailDesc", { count: selectedIds.length })}
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t("bulkEmailSubject")}
            </label>
            <input
              ref={subjectRef}
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t("bulkEmailSubjectPlaceholder")}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t("bulkEmailMessage")}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("bulkEmailMessagePlaceholder")}
              rows={5}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-accent disabled:opacity-50"
          >
            {t("bulkEmailCancel")}
          </button>
          <button
            onClick={handleSend}
            disabled={isPending}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {t("bulkEmailSend")}
          </button>
        </div>
      </div>
    </div>
  );
}
