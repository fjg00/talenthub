"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Sparkles, FileText, CheckCircle } from "lucide-react";
import { parseCVAndUpdateProfileAction } from "@/lib/actions/ai";
import type { ParsedCV } from "@/lib/ai/cv-parser";

export function AICVParser() {
  const t = useTranslations("ai");
  const [cvText, setCvText] = useState("");
  const [result, setResult] = useState<ParsedCV | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleParse() {
    setError(null);
    startTransition(async () => {
      const res = await parseCVAndUpdateProfileAction(cvText);
      if (res.error) setError(res.error);
      else if (res.data) setResult(res.data);
    });
  }

  if (result) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-2xl border border-success/20 bg-success/5 p-5"
      >
        <div className="mb-3 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-success" />
          <h3 className="font-semibold text-foreground">
            {t("parseCVSuccess")}
          </h3>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          {result.headline && (
            <p>
              <span className="font-medium text-foreground">Headline:</span>{" "}
              {result.headline}
            </p>
          )}
          {result.skills.length > 0 && (
            <div>
              <span className="font-medium text-foreground">Skills:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {result.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
          {result.experienceYears > 0 && (
            <p>
              <span className="font-medium text-foreground">Experience:</span>{" "}
              {result.experienceYears} years
            </p>
          )}
          {result.education && (
            <p>
              <span className="font-medium text-foreground">Education:</span>{" "}
              {result.education}
            </p>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-violet-500/30 bg-gradient-to-br from-violet-500/5 to-purple-500/5 p-5">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-violet-500" />
        <h3 className="font-semibold text-foreground">{t("parseCV")}</h3>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{t("parseCVDesc")}</p>

      <textarea
        value={cvText}
        onChange={(e) => setCvText(e.target.value)}
        rows={6}
        placeholder={t("parseCVPlaceholder")}
        className="mt-3 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />

      {error && <p className="mt-2 text-sm text-error">{t("error")}</p>}

      <button
        onClick={handleParse}
        disabled={isPending || cvText.trim().length < 50}
        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        <Sparkles className="h-4 w-4" />
        {isPending ? t("loading") : t("parseCVButton")}
      </button>
    </div>
  );
}
