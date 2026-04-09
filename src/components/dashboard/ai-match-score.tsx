"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp, TrendingDown } from "lucide-react";
import { getMatchScoreAction } from "@/lib/actions/ai";
import type { MatchResult } from "@/lib/ai/match-score";

interface AIMatchScoreProps {
  applicationId: string;
  jobId: string;
}

export function AIMatchScore({ applicationId, jobId }: AIMatchScoreProps) {
  const t = useTranslations("ai");
  const [result, setResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleGetScore() {
    setError(null);
    startTransition(async () => {
      const res = await getMatchScoreAction(applicationId, jobId);
      if (res.error) setError(res.error);
      else if (res.data) setResult(res.data);
    });
  }

  if (!result) {
    return (
      <div className="flex flex-col gap-1">
        <button
          onClick={handleGetScore}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-500/10 to-purple-500/10 px-3 py-1.5 text-xs font-medium text-violet-600 transition-colors hover:from-violet-500/20 hover:to-purple-500/20 disabled:opacity-50 dark:text-violet-400"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {isPending ? t("loading") : t("deepAnalysis")}
        </button>
        <span className="text-[10px] text-muted-foreground">{t("usesCredits")}</span>
        {error && <p className="text-[10px] text-error">{t("quotaExceeded")}</p>}
      </div>
    );
  }

  const scoreColor =
    result.score >= 75
      ? "text-success"
      : result.score >= 50
        ? "text-warning"
        : "text-error";

  const scoreBg =
    result.score >= 75
      ? "from-emerald-500/10 to-green-500/10 border-success/20"
      : result.score >= 50
        ? "from-amber-500/10 to-yellow-500/10 border-warning/20"
        : "from-red-500/10 to-rose-500/10 border-error/20";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-xl border bg-gradient-to-br ${scoreBg} p-4`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-violet-500" />
          {t("matchScore")}
        </span>
        <span className={`text-2xl font-bold ${scoreColor}`}>
          {result.score}%
        </span>
      </div>

      <p className="mb-3 text-sm text-muted-foreground">{result.summary}</p>

      {result.strengths.length > 0 && (
        <div className="mb-2">
          <span className="flex items-center gap-1 text-xs font-medium text-success">
            <TrendingUp className="h-3 w-3" /> {t("strengths")}
          </span>
          <ul className="mt-1 space-y-0.5">
            {result.strengths.map((s, i) => (
              <li key={i} className="text-xs text-muted-foreground">
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.gaps.length > 0 && (
        <div>
          <span className="flex items-center gap-1 text-xs font-medium text-warning">
            <TrendingDown className="h-3 w-3" /> {t("gaps")}
          </span>
          <ul className="mt-1 space-y-0.5">
            {result.gaps.map((g, i) => (
              <li key={i} className="text-xs text-muted-foreground">
                {g}
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-error">{t("error")}</p>}
    </motion.div>
  );
}
