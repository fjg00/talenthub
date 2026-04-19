"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  Plus,
  Trash2,
  Save,
  RefreshCw,
  Loader2,
  Sparkles,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import {
  updateInterviewQuestionsAction,
  regenerateInterviewQuestionsAction,
} from "@/lib/actions/interviews";

type Category = "technical" | "behavioral" | "cultural";
type Question = { text: string; category: Category };

interface InterviewQuestionsEditorProps {
  interviewId: string;
  initialQuestions: Question[];
}

const CATEGORIES: Category[] = ["technical", "behavioral", "cultural"];

export function InterviewQuestionsEditor({
  interviewId,
  initialQuestions,
}: InterviewQuestionsEditorProps) {
  const t = useTranslations("interview");
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [isSaving, startSave] = useTransition();
  const [isRegenerating, startRegen] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirmRegen, setConfirmRegen] = useState(false);

  const dirty =
    JSON.stringify(questions) !== JSON.stringify(initialQuestions);

  function updateQuestion(idx: number, patch: Partial<Question>) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, ...patch } : q))
    );
    setSaved(false);
  }

  function addQuestion() {
    if (questions.length >= 10) return;
    setQuestions((prev) => [...prev, { text: "", category: "technical" }]);
    setSaved(false);
  }

  function removeQuestion(idx: number) {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
    setSaved(false);
  }

  function handleSave() {
    setError(null);
    // Client-side validation mirror
    if (questions.some((q) => q.text.trim().length === 0)) {
      setError(t("emptyQuestion"));
      return;
    }
    startSave(async () => {
      const res = await updateInterviewQuestionsAction(interviewId, questions);
      if (res.error) {
        setError(t(res.error));
      } else {
        setSaved(true);
      }
    });
  }

  function handleRegenerate() {
    setError(null);
    setWarning(null);
    setConfirmRegen(false);
    startRegen(async () => {
      const res = await regenerateInterviewQuestionsAction(interviewId);
      if (res.error) {
        setError(t(res.error));
      } else if (res.warning) {
        setWarning(t(res.warning));
      }
      // Server revalidates — RSC parent reloads with new questions.
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Sparkles className="h-4 w-4 text-violet-500" />
            {t("editQuestionsTitle")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("editQuestionsDesc")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setConfirmRegen(true)}
          disabled={isRegenerating || isSaving}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
        >
          {isRegenerating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          {t("regenerate")}
        </button>
      </div>

      {confirmRegen && (
        <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-foreground">
                {t("regenerateConfirmTitle")}
              </p>
              <p className="mt-0.5 text-muted-foreground">
                {t("regenerateConfirmDesc")}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={handleRegenerate}
                  className="rounded-lg bg-amber-500 px-3 py-1 text-xs font-medium text-white hover:bg-amber-600"
                >
                  {t("regenerateConfirm")}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmRegen(false)}
                  className="rounded-lg border border-border bg-background px-3 py-1 text-xs font-medium text-foreground hover:bg-accent"
                >
                  {t("cancel")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ol className="space-y-3">
        {questions.map((q, idx) => (
          <li
            key={idx}
            className="rounded-xl border border-border bg-background/50 p-3"
          >
            <div className="flex items-start gap-2">
              <span className="mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {idx + 1}
              </span>
              <div className="flex-1 space-y-2">
                <textarea
                  value={q.text}
                  onChange={(e) =>
                    updateQuestion(idx, { text: e.target.value })
                  }
                  rows={2}
                  maxLength={1000}
                  placeholder={t("questionPlaceholder")}
                  aria-label={t("questionLabel", { number: idx + 1 })}
                  className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
                <div className="flex items-center justify-between gap-2">
                  <select
                    value={q.category}
                    onChange={(e) =>
                      updateQuestion(idx, {
                        category: e.target.value as Category,
                      })
                    }
                    aria-label={t("categoryLabel")}
                    className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {t(`category_${c}`)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeQuestion(idx)}
                    disabled={questions.length <= 1}
                    aria-label={t("removeQuestion")}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-error/30 hover:bg-error/5 hover:text-error disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 className="h-3 w-3" />
                    {t("remove")}
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <button
        type="button"
        onClick={addQuestion}
        disabled={questions.length >= 10}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus className="h-3.5 w-3.5" />
        {t("addQuestion")}
      </button>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-error/20 bg-error/10 p-3 text-sm text-error"
        >
          {error}
        </div>
      )}

      {warning && (
        <div
          role="status"
          className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-300"
        >
          {warning}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">
          {t("questionsCount", { count: questions.length })}
        </p>
        <div className="flex items-center gap-2">
          {saved && !dirty && (
            <span className="inline-flex items-center gap-1 text-xs text-success">
              <CheckCircle className="h-3.5 w-3.5" />
              {t("saved")}
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || isSaving || isRegenerating}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {t("saveQuestions")}
          </button>
        </div>
      </div>
    </div>
  );
}
