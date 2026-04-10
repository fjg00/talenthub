"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { useState, useTransition } from "react";
import {
  Sparkles,
  Video,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  evaluateResponseAction,
  evaluateInterviewAction,
} from "@/lib/actions/interviews";

interface Response {
  questionIndex: number;
  videoUrl: string | null;
  transcript: string | null;
  durationSeconds: number | null;
  aiScore: number | null;
  aiFeedback: string | null;
  aiImprovements: string[] | null;
}

interface InterviewResultsProps {
  interviewId: string;
  questions: { text: string; category: string }[];
  responses: Response[];
  overallScore: number | null;
  overallFeedback: string | null;
  overallImprovements: string[] | null;
  status: string;
  isEmployer?: boolean;
}

export function InterviewResults({
  interviewId,
  questions,
  responses,
  overallScore,
  overallFeedback,
  overallImprovements,
  status,
  isEmployer = false,
}: InterviewResultsProps) {
  const t = useTranslations("interview");
  const [isPending, startTransition] = useTransition();
  const [evalError, setEvalError] = useState<string | null>(null);

  if (status === "pending") {
    return (
      <div className="rounded-xl border border-border bg-card p-4 text-center">
        <Video className="mx-auto h-8 w-8 text-muted-foreground/30" />
        <p className="mt-2 text-sm text-muted-foreground">
          {t("interviewPending")}
        </p>
      </div>
    );
  }

  if (status === "in_progress") {
    return (
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
        <Video className="mx-auto h-8 w-8 animate-pulse text-amber-500" />
        <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
          {t("interviewInProgress")}
        </p>
      </div>
    );
  }

  const hasUnevaluatedResponses = responses.some(
    (r) => r.transcript && r.aiScore == null
  );
  const canEvaluateOverall =
    isEmployer &&
    (status === "completed" || (status === "evaluated" && overallScore == null)) &&
    responses.some((r) => r.transcript);

  const scoreColor =
    (overallScore ?? 0) >= 75
      ? "text-success"
      : (overallScore ?? 0) >= 50
        ? "text-warning"
        : "text-error";

  function handleEvaluateAll() {
    setEvalError(null);
    startTransition(async () => {
      const res = await evaluateInterviewAction(interviewId);
      if (res.error) setEvalError(res.error);
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Overall Score Card */}
      {overallScore != null && (
        <div className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-purple-500/5 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              <span className="font-semibold text-foreground">
                {t("overallScore")}
              </span>
            </div>
            <span className={`text-3xl font-bold ${scoreColor}`}>
              {overallScore}%
            </span>
          </div>

          {overallFeedback && (
            <p className="mt-3 text-sm text-muted-foreground">
              {overallFeedback}
            </p>
          )}

          {overallImprovements && overallImprovements.length > 0 && (
            <div className="mt-3">
              <span className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-3.5 w-3.5" />
                {t("areasToImprove")}
              </span>
              <ul className="mt-1.5 space-y-1">
                {overallImprovements.map((imp, i) => (
                  <li key={i} className="text-xs text-muted-foreground">
                    • {imp}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Evaluate All button for employers */}
      {canEvaluateOverall && (
        <div className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-purple-500/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                {t("evaluateWithAI")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("evaluateWithAIDesc")}
              </p>
            </div>
            <button
              onClick={handleEvaluateAll}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {isPending ? t("evaluating") : t("evaluateAll")}
            </button>
          </div>
          {evalError && (
            <p className="mt-2 text-xs text-error">{evalError}</p>
          )}
        </div>
      )}

      {/* Per-question responses */}
      <div className="space-y-3">
        {questions.map((q, i) => {
          const response = responses.find((r) => r.questionIndex === i);
          if (!response) return null;

          return (
            <ResponseCard
              key={i}
              question={q}
              response={response}
              interviewId={interviewId}
              isEmployer={isEmployer}
            />
          );
        })}
      </div>
    </motion.div>
  );
}

function ResponseCard({
  question,
  response,
  interviewId,
  isEmployer,
}: {
  question: { text: string; category: string };
  response: Response;
  interviewId: string;
  isEmployer: boolean;
}) {
  const t = useTranslations("interview");
  const [isPending, startTransition] = useTransition();

  const qScoreColor =
    (response.aiScore ?? 0) >= 75
      ? "text-success"
      : (response.aiScore ?? 0) >= 50
        ? "text-warning"
        : "text-error";

  const canEvaluate =
    isEmployer && response.aiScore == null && response.transcript;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <span className="inline-block rounded-full bg-accent px-2 py-0.5 text-xs text-muted-foreground">
            {question.category}
          </span>
          <p className="mt-1 text-sm font-medium text-foreground">
            {question.text}
          </p>
        </div>
        {response.aiScore != null ? (
          <span className={`text-lg font-bold ${qScoreColor}`}>
            {response.aiScore}%
          </span>
        ) : canEvaluate ? (
          <button
            onClick={() =>
              startTransition(async () => {
                await evaluateResponseAction(
                  interviewId,
                  response.questionIndex
                );
              })
            }
            disabled={isPending}
            className="inline-flex items-center gap-1 rounded-lg bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-600 transition-colors hover:bg-violet-500/20 disabled:opacity-50 dark:text-violet-400"
          >
            {isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            {t("evaluate")}
          </button>
        ) : null}
      </div>

      {/* Video playback */}
      {response.videoUrl && (
        <div className="mt-3 overflow-hidden rounded-lg">
          <video
            src={response.videoUrl}
            controls
            preload="metadata"
            className="aspect-video w-full bg-black"
          />
        </div>
      )}

      {/* Transcript */}
      {response.transcript && (
        <div className="mt-2 rounded-lg bg-accent/50 p-2">
          <p className="text-xs text-muted-foreground">
            {response.transcript}
          </p>
        </div>
      )}

      {/* AI Feedback */}
      {response.aiFeedback && (
        <p className="mt-2 text-xs text-muted-foreground">
          <TrendingUp className="me-1 inline h-3 w-3 text-success" />
          {response.aiFeedback}
        </p>
      )}

      {/* Improvements */}
      {response.aiImprovements && response.aiImprovements.length > 0 && (
        <div className="mt-2">
          {response.aiImprovements.map((imp, j) => (
            <p
              key={j}
              className="text-xs text-amber-600 dark:text-amber-400"
            >
              <TrendingDown className="me-1 inline h-3 w-3" />
              {imp}
            </p>
          ))}
        </div>
      )}

      {/* Duration */}
      {response.durationSeconds && (
        <span className="mt-2 inline-block text-xs text-muted-foreground">
          {Math.floor(response.durationSeconds / 60)}:
          {(response.durationSeconds % 60).toString().padStart(2, "0")}
        </span>
      )}
    </div>
  );
}
