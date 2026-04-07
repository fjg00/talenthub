"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Sparkles, Lightbulb, Copy, Check } from "lucide-react";
import { optimizeJobAction } from "@/lib/actions/ai";
import type { JobOptimization } from "@/lib/ai/job-optimizer";

interface AIJobOptimizerProps {
  jobId: string;
}

export function AIJobOptimizer({ jobId }: AIJobOptimizerProps) {
  const t = useTranslations("ai");
  const [result, setResult] = useState<JobOptimization | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  function handleOptimize() {
    setError(null);
    startTransition(async () => {
      const res = await optimizeJobAction(jobId);
      if (res.error) setError(res.error);
      else if (res.data) setResult(res.data);
    });
  }

  function handleCopy() {
    if (result) {
      navigator.clipboard.writeText(result.improvedDescription);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (!result) {
    return (
      <div className="rounded-2xl border border-dashed border-violet-500/30 bg-gradient-to-br from-violet-500/5 to-purple-500/5 p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-500" />
          <h3 className="font-semibold text-foreground">{t("optimizeJob")}</h3>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("optimizeJobDesc")}
        </p>
        <button
          onClick={handleOptimize}
          disabled={isPending}
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          {isPending ? t("loading") : t("optimizeJob")}
        </button>
        {error && <p className="mt-2 text-sm text-error">{t("error")}</p>}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-purple-500/5 p-5"
    >
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-violet-500" />
        <h3 className="font-semibold text-foreground">{t("optimizeJob")}</h3>
      </div>

      {/* Improved Description */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            {t("improvedDescription")}
          </span>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent"
          >
            {copied ? (
              <Check className="h-3 w-3 text-success" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <p className="whitespace-pre-wrap rounded-xl bg-background/50 p-3 text-sm text-muted-foreground">
          {result.improvedDescription}
        </p>
      </div>

      {/* Suggested Skills */}
      {result.suggestedSkills.length > 0 && (
        <div>
          <span className="text-sm font-medium text-foreground">
            {t("suggestedSkills")}
          </span>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {result.suggestedSkills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs text-violet-600 dark:text-violet-400"
              >
                + {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      {result.tips.length > 0 && (
        <div>
          <span className="text-sm font-medium text-foreground">
            {t("tips")}
          </span>
          <ul className="mt-1.5 space-y-1.5">
            {result.tips.map((tip, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
