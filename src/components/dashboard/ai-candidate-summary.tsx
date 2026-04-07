"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Sparkles, Brain } from "lucide-react";
import { getCandidateSummaryAction } from "@/lib/actions/ai";
import type { CandidateSummary } from "@/lib/ai/candidate-summary";

interface AICandidateSummaryProps {
  candidateId: string;
}

export function AICandidateSummary({ candidateId }: AICandidateSummaryProps) {
  const t = useTranslations("ai");
  const [result, setResult] = useState<CandidateSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const res = await getCandidateSummaryAction(candidateId);
      if (res.error) setError(res.error);
      else if (res.data) setResult(res.data);
    });
  }

  if (!result) {
    return (
      <button
        onClick={handleGenerate}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-500/10 to-purple-500/10 px-3 py-1.5 text-xs font-medium text-violet-600 transition-colors hover:from-violet-500/20 hover:to-purple-500/20 disabled:opacity-50 dark:text-violet-400"
      >
        <Brain className="h-3.5 w-3.5" />
        {isPending ? t("loading") : t("generateSummary")}
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-purple-500/5 p-4"
    >
      <div className="mb-3 flex items-center gap-1.5">
        <Sparkles className="h-4 w-4 text-violet-500" />
        <span className="text-sm font-semibold text-foreground">
          {t("candidateSummary")}
        </span>
      </div>

      <p className="mb-3 text-sm text-muted-foreground">{result.summary}</p>

      {result.topSkills.length > 0 && (
        <div className="mb-3">
          <span className="text-xs font-medium text-muted-foreground">
            {t("topSkills")}
          </span>
          <div className="mt-1 flex flex-wrap gap-1">
            {result.topSkills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-violet-500/10 px-2 py-0.5 text-xs text-violet-600 dark:text-violet-400"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium">{t("experienceLevel")}:</span>
        <span className="capitalize">{result.experienceLevel}</span>
      </div>

      <div className="rounded-lg bg-violet-500/10 p-2">
        <span className="text-xs font-medium text-violet-600 dark:text-violet-400">
          {t("recommendation")}
        </span>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {result.recommendation}
        </p>
      </div>

      {error && <p className="mt-2 text-xs text-error">{t("error")}</p>}
    </motion.div>
  );
}
