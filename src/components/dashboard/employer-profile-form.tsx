"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, CheckCircle } from "lucide-react";
import {
  updateEmployerProfileAction,
  type ProfileState,
} from "@/lib/actions/profile";

interface EmployerProfile {
  companyName: string | null;
  companyDescription: string | null;
  companyWebsite: string | null;
  companySize: "1-10" | "11-50" | "51-200" | "201-500" | "501-1000" | "1000+" | null;
  industry: string | null;
  location: string | null;
}

const companySizes = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1000+",
] as const;

export function EmployerProfileForm({
  profile,
}: {
  profile: EmployerProfile | null;
}) {
  const t = useTranslations("profile");
  const [state, formAction, isPending] = useActionState<ProfileState, FormData>(
    updateEmployerProfileAction,
    {}
  );

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-8 text-2xl font-bold text-foreground">{t("title")}</h1>

      {state.success && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-success/20 bg-success/10 p-3 text-sm text-success">
          <CheckCircle className="h-4 w-4" />
          {t("saved")}
        </div>
      )}

      {state.error && (
        <div className="mb-4 rounded-xl border border-error/20 bg-error/10 p-3 text-center text-sm text-error">
          {t("error")}
        </div>
      )}

      <form action={formAction} className="space-y-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {t("companyName")}
          </label>
          <input
            name="companyName"
            type="text"
            required
            defaultValue={profile?.companyName ?? ""}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {t("companyDescription")}
          </label>
          <textarea
            name="companyDescription"
            rows={4}
            defaultValue={profile?.companyDescription ?? ""}
            placeholder={t("companyDescriptionPlaceholder")}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {t("companyWebsite")}
          </label>
          <input
            name="companyWebsite"
            type="url"
            defaultValue={profile?.companyWebsite ?? ""}
            placeholder="https://..."
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              {t("companySize")}
            </label>
            <select
              name="companySize"
              defaultValue={profile?.companySize ?? ""}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="" disabled>
                —
              </option>
              {companySizes.map((size) => (
                <option key={size} value={size}>
                  {size} {t("employees")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              {t("industry")}
            </label>
            <input
              name="industry"
              type="text"
              defaultValue={profile?.industry ?? ""}
              placeholder={t("industryPlaceholder")}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {t("location")}
          </label>
          <input
            name="location"
            type="text"
            defaultValue={profile?.location ?? ""}
            placeholder={t("locationPlaceholder")}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isPending ? t("saving") : t("save")}
        </button>
      </form>
    </div>
  );
}
