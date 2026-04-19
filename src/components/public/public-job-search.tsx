"use client";

import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { usePathname } from "@/i18n/navigation";
import { Search, X, SlidersHorizontal, ChevronDown } from "lucide-react";
import { useTransition, useState, useCallback, useRef, useEffect } from "react";

const jobTypes = ["full_time", "part_time", "contract", "remote"] as const;
const experienceLevels = ["entry", "mid", "senior", "lead"] as const;
const currencies = ["USD", "SAR", "AED", "QAR", "KWD", "BHD", "OMR", "EGP"] as const;

const filterKeys = ["keyword", "jobType", "experienceLevel", "location", "salaryMin", "salaryMax", "currency", "skills"] as const;

export function PublicJobSearch() {
  const t = useTranslations("jobs");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showAdvanced, setShowAdvanced] = useState(() => {
    return !!(
      searchParams.get("location") ||
      searchParams.get("salaryMin") ||
      searchParams.get("salaryMax") ||
      searchParams.get("currency") ||
      searchParams.get("skills")
    );
  });
  const [skillInput, setSkillInput] = useState("");
  const [keywordValue, setKeywordValue] = useState(searchParams.get("keyword") ?? "");
  const [locationValue, setLocationValue] = useState(searchParams.get("location") ?? "");
  const [salaryMinValue, setSalaryMinValue] = useState(searchParams.get("salaryMin") ?? "");
  const [salaryMaxValue, setSalaryMaxValue] = useState(searchParams.get("salaryMax") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeSkills = searchParams.get("skills")?.split(",").filter(Boolean) ?? [];

  const activeFilterCount = filterKeys.filter(
    (k) => k !== "keyword" && searchParams.get(k)
  ).length;

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  const debouncedUpdate = useCallback(
    (key: string, value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => updateFilter(key, value), 300);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams, pathname]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function addSkill(skill: string) {
    const trimmed = skill.trim();
    if (!trimmed || activeSkills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) return;
    const next = [...activeSkills, trimmed];
    updateFilter("skills", next.join(","));
    setSkillInput("");
  }

  function removeSkill(skill: string) {
    const next = activeSkills.filter((s) => s !== skill);
    updateFilter("skills", next.join(","));
  }

  function clearAll() {
    startTransition(() => {
      router.push(pathname);
    });
    setKeywordValue("");
    setLocationValue("");
    setSalaryMinValue("");
    setSalaryMaxValue("");
    setSkillInput("");
  }

  const selectClass =
    "rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
  const inputClass =
    "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <div className="mb-8 space-y-3">
      {/* Keyword search */}
      <div className="relative">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={keywordValue}
          placeholder={t("search")}
          onChange={(e) => {
            setKeywordValue(e.target.value);
            debouncedUpdate("keyword", e.target.value);
          }}
          className="w-full rounded-xl border border-border bg-background py-3 ps-10 pe-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Basic filters row */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          defaultValue={searchParams.get("jobType") ?? ""}
          onChange={(e) => updateFilter("jobType", e.target.value)}
          className={selectClass}
        >
          <option value="">{t("allTypes")}</option>
          {jobTypes.map((type) => (
            <option key={type} value={type}>
              {t(type)}
            </option>
          ))}
        </select>

        <select
          defaultValue={searchParams.get("experienceLevel") ?? ""}
          onChange={(e) => updateFilter("experienceLevel", e.target.value)}
          className={selectClass}
        >
          <option value="">{t("allLevels")}</option>
          {experienceLevels.map((level) => (
            <option key={level} value={level}>
              {t(level)}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-accent"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {t("advancedFilters")}
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
          />
        </button>

        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="flex items-center gap-1 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
            {t("clearAll")}
          </button>
        )}
      </div>

      {/* Advanced filters panel */}
      {showAdvanced && (
        <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                {t("location")}
              </label>
              <input
                type="text"
                value={locationValue}
                placeholder={t("locationPlaceholder")}
                onChange={(e) => {
                  setLocationValue(e.target.value);
                  debouncedUpdate("location", e.target.value);
                }}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                {t("currency")}
              </label>
              <select
                defaultValue={searchParams.get("currency") ?? ""}
                onChange={(e) => updateFilter("currency", e.target.value)}
                className={`${inputClass} appearance-auto`}
              >
                <option value="">{t("anyCurrency")}</option>
                {currencies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                {t("salaryRange")}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={salaryMinValue}
                  placeholder={t("salaryMin")}
                  onChange={(e) => {
                    setSalaryMinValue(e.target.value);
                    debouncedUpdate("salaryMin", e.target.value);
                  }}
                  className={inputClass}
                />
                <span className="text-muted-foreground">-</span>
                <input
                  type="number"
                  value={salaryMaxValue}
                  placeholder={t("salaryMax")}
                  onChange={(e) => {
                    setSalaryMaxValue(e.target.value);
                    debouncedUpdate("salaryMax", e.target.value);
                  }}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              {t("skills")}
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {activeSkills.map((skill) => (
                <span
                  key={skill}
                  className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary"
                >
                  {skill}
                  <button type="button" onClick={() => removeSkill(skill)} className="hover:text-primary/70">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={skillInput}
              placeholder={t("skillsFilterPlaceholder")}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addSkill(skillInput);
                }
              }}
              className={inputClass}
            />
          </div>
        </div>
      )}

      {/* Active filter tags */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {searchParams.get("jobType") && (
            <FilterTag label={t(searchParams.get("jobType")!)} onRemove={() => updateFilter("jobType", "")} />
          )}
          {searchParams.get("experienceLevel") && (
            <FilterTag label={t(searchParams.get("experienceLevel")!)} onRemove={() => updateFilter("experienceLevel", "")} />
          )}
          {searchParams.get("location") && (
            <FilterTag label={searchParams.get("location")!} onRemove={() => updateFilter("location", "")} />
          )}
          {searchParams.get("currency") && (
            <FilterTag label={searchParams.get("currency")!} onRemove={() => updateFilter("currency", "")} />
          )}
          {searchParams.get("salaryMin") && (
            <FilterTag label={`Min: ${Number(searchParams.get("salaryMin")).toLocaleString()}`} onRemove={() => updateFilter("salaryMin", "")} />
          )}
          {searchParams.get("salaryMax") && (
            <FilterTag label={`Max: ${Number(searchParams.get("salaryMax")).toLocaleString()}`} onRemove={() => updateFilter("salaryMax", "")} />
          )}
          {activeSkills.map((skill) => (
            <FilterTag key={skill} label={skill} onRemove={() => removeSkill(skill)} />
          ))}
        </div>
      )}

      {isPending && (
        <div className="h-1 overflow-hidden rounded-full bg-primary/10">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
        </div>
      )}
    </div>
  );
}

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-xs text-foreground">
      {label}
      <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-foreground">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
