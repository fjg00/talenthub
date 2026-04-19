"use client";

import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { usePathname } from "@/i18n/navigation";
import { LayoutList, Columns3 } from "lucide-react";

export function ViewToggle() {
  const t = useTranslations("applications");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = searchParams.get("view") ?? "list";

  function setView(v: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (v === "list") {
      params.delete("view");
    } else {
      params.set("view", v);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex rounded-lg border border-border bg-background p-0.5">
      <button
        onClick={() => setView("list")}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
          view === "list"
            ? "bg-accent text-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <LayoutList className="h-3.5 w-3.5" />
        {t("listView")}
      </button>
      <button
        onClick={() => setView("kanban")}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
          view === "kanban"
            ? "bg-accent text-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Columns3 className="h-3.5 w-3.5" />
        {t("kanbanView")}
      </button>
    </div>
  );
}
