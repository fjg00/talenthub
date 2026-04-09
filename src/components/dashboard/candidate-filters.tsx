"use client";

import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

export function CandidateFilters() {
  const t = useTranslations("candidates");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSort = searchParams.get("sort") ?? "name";
  const currentName = searchParams.get("name") ?? "";
  const currentSkill = searchParams.get("skill") ?? "";
  const currentLocation = searchParams.get("location") ?? "";
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

      {/* Name search */}
      <div className="relative">
        <Search className="absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder={t("searchByName")}
          defaultValue={currentName}
          onKeyDown={(e) => {
            if (e.key === "Enter") update("name", e.currentTarget.value);
          }}
          onBlur={(e) => update("name", e.currentTarget.value)}
          className="rounded-lg border border-border bg-background py-1.5 pe-2.5 ps-8 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
      </div>

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

      {/* Location filter */}
      <input
        type="text"
        placeholder={t("filterByLocation")}
        defaultValue={currentLocation}
        onKeyDown={(e) => {
          if (e.key === "Enter") update("location", e.currentTarget.value);
        }}
        onBlur={(e) => update("location", e.currentTarget.value)}
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

      {/* Sort */}
      <select
        value={currentSort}
        onChange={(e) => update("sort", e.target.value)}
        disabled={isPending}
        className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
      >
        <option value="name">{t("sortByName")}</option>
        <option value="experience">{t("sortByExperience")}</option>
        <option value="applications">{t("sortByApplications")}</option>
      </select>
    </div>
  );
}
