"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  Sparkles,
  Video,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from "lucide-react";

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
  questions: { text: string; category: string }[];
  responses: Response[];
  overallScore: number | null;
  overallFeedback: string | null;
  overallImprovements: string[] | null;
  status: string;
}

export function InterviewResults({
  questions,
  responses,
  overallScore,
  overallFeedback,
  overallImprovements,
  status,
}: InterviewResultsProps) {
  const t = useTranslations("interview");

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

  const scoreColor =
    (overallScore ?? 0) >= 75
      ? "text-success"
      : (overallScore ?? 0) >= 50
        ? "text-warning"
        : "text-error";

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

      {/* Per-question responses */}
      <div className="space-y-3">
        {questions.map((q, i) => {
          const response = responses.find((r) => r.questionIndex === i);
          if (!response) return null;

          const qScoreColor =
            (response.aiScore ?? 0) >= 75
              ? "text-success"
              : (response.aiScore ?? 0) >= 50
                ? "text-warning"
                : "text-error";

          return (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <span className="inline-block rounded-full bg-accent px-2 py-0.5 text-xs text-muted-foreground">
                    {q.category}
                  </span>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {q.text}
                  </p>
                </div>
                {response.aiScore != null && (
                  <span className={`text-lg font-bold ${qScoreColor}`}>
                    {response.aiScore}%
                  </span>
                )}
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
                    <p key={j} className="text-xs text-amber-600 dark:text-amber-400">
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
        })}
      </div>
    </motion.div>
  );
}
