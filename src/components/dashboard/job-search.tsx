"use client";

import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { usePathname } from "@/i18n/navigation";
import { Search } from "lucide-react";
import { useTransition } from "react";

const jobTypes = ["full_time", "part_time", "contract", "remote"] as const;
const experienceLevels = ["entry", "mid", "senior", "lead"] as const;

export function JobSearch() {
  const t = useTranslations("jobs");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page"); // reset pagination on filter change
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="mb-6 space-y-3">
      <div className="relative">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          defaultValue={searchParams.get("keyword") ?? ""}
          placeholder={t("search")}
          onChange={(e) => updateFilter("keyword", e.target.value)}
          className="w-full rounded-xl border border-border bg-background py-3 ps-10 pe-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <select
          defaultValue={searchParams.get("jobType") ?? ""}
          onChange={(e) => updateFilter("jobType", e.target.value)}
          className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
          className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">{t("allLevels")}</option>
          {experienceLevels.map((level) => (
            <option key={level} value={level}>
              {t(level)}
            </option>
          ))}
        </select>
      </div>
      {isPending && (
        <div className="h-1 overflow-hidden rounded-full bg-primary/10">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
        </div>
      )}
    </div>
  );
}
