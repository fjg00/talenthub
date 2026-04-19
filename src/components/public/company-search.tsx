"use client";

import { useRouter } from "@/i18n/navigation";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function CompanySearch({ defaultKeyword }: { defaultKeyword: string }) {
  const t = useTranslations("companies");
  const router = useRouter();
  const [value, setValue] = useState(defaultKeyword);

  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const q = value.trim();
        router.push(
          q
            ? { pathname: "/companies", query: { keyword: q } }
            : { pathname: "/companies" }
        );
      }}
    >
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full rounded-xl border border-border bg-background pl-9 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      <button
        type="submit"
        className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
      >
        {t("search")}
      </button>
    </form>
  );
}
