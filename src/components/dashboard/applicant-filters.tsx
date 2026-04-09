"use client";

import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { SlidersHorizontal } from "lucide-react";

export function ApplicantFilters() {
  const t = useTranslations("applications");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSort = searchParams.get("sort") ?? "match";
  const currentStatus = searchParams.get("status") ?? "";
  const currentSkill = searchParams.get("skill") ?? "";
  const currentExpMin = searchParams.get("expMin") ?? "";
  const currentExpMax = searchParams.get("expMax") ?? "";

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
      <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />

      {/* Sort */}
      <select
        value={currentSort}
        onChange={(e) => update("sort", e.target.value)}
        disabled={isPending}
        className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
      >
        <option value="match">{t("sortByMatch")}</option>
        <option value="name">{t("sortByName")}</option>
        <option value="date">{t("sortByDate")}</option>
        <option value="experience">{t("sortByExperience")}</option>
      </select>

      {/* Status filter */}
      <select
        value={currentStatus}
        onChange={(e) => update("status", e.target.value)}
        disabled={isPending}
        className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
      >
        <option value="">{t("allStatuses")}</option>
        <option value="applied">{t("applied")}</option>
        <option value="reviewed">{t("reviewed")}</option>
        <option value="shortlisted">{t("shortlisted")}</option>
        <option value="interview">{t("interview")}</option>
        <option value="offered">{t("offered")}</option>
        <option value="rejected">{t("rejected")}</option>
        <option value="hired">{t("hired")}</option>
      </select>

      {/* Skills filter */}
      <input
        type="text"
        placeholder={t("filterBySkills")}
        defaultValue={currentSkill}
        onKeyDown={(e) => {
          if (e.key === "Enter") update("skill", e.currentTarget.value);
        }}
        onBlur={(e) => update("skill", e.currentTarget.value)}
        className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
      />

      {/* Experience range */}
      <div className="flex items-center gap-1">
        <input
          type="number"
          placeholder={t("expMin")}
          defaultValue={currentExpMin}
          min={0}
          max={50}
          onBlur={(e) => update("expMin", e.currentTarget.value)}
          className="w-16 rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
        <span className="text-xs text-muted-foreground">–</span>
        <input
          type="number"
          placeholder={t("expMax")}
          defaultValue={currentExpMax}
          min={0}
          max={50}
          onBlur={(e) => update("expMax", e.currentTarget.value)}
          className="w-16 rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
        <span className="text-xs text-muted-foreground">{t("yearsExp")}</span>
      </div>
    </div>
  );
}
