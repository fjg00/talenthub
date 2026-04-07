"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, CheckCircle } from "lucide-react";
import {
  updateCandidateProfileAction,
  type ProfileState,
} from "@/lib/actions/profile";
import { CvUpload } from "./cv-upload";

interface CandidateProfile {
  headline: string | null;
  bio: string | null;
  skills: string[] | null;
  experienceYears: number | null;
  education: string | null;
  location: string | null;
  linkedinUrl: string | null;
  phone: string | null;
  availabilityStatus: "open" | "not_looking" | "open_to_offers" | null;
  cvUrl: string | null;
}

export function CandidateProfileForm({
  profile,
}: {
  profile: CandidateProfile | null;
}) {
  const t = useTranslations("profile");
  const [state, formAction, isPending] = useActionState<ProfileState, FormData>(
    updateCandidateProfileAction,
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
            {t("headline")}
          </label>
          <input
            name="headline"
            type="text"
            defaultValue={profile?.headline ?? ""}
            placeholder={t("headlinePlaceholder")}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {t("bio")}
          </label>
          <textarea
            name="bio"
            rows={4}
            defaultValue={profile?.bio ?? ""}
            placeholder={t("bioPlaceholder")}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {t("skills")}
          </label>
          <input
            name="skills"
            type="text"
            defaultValue={profile?.skills?.join(", ") ?? ""}
            placeholder={t("skillsPlaceholder")}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              {t("experienceYears")}
            </label>
            <input
              name="experienceYears"
              type="number"
              min={0}
              max={50}
              defaultValue={profile?.experienceYears ?? ""}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              {t("availabilityStatus")}
            </label>
            <select
              name="availabilityStatus"
              defaultValue={profile?.availabilityStatus ?? "open"}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="open">{t("open")}</option>
              <option value="not_looking">{t("not_looking")}</option>
              <option value="open_to_offers">{t("open_to_offers")}</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {t("education")}
          </label>
          <input
            name="education"
            type="text"
            defaultValue={profile?.education ?? ""}
            placeholder={t("educationPlaceholder")}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
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

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {t("linkedinUrl")}
          </label>
          <input
            name="linkedinUrl"
            type="url"
            defaultValue={profile?.linkedinUrl ?? ""}
            placeholder="https://linkedin.com/in/..."
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {t("phone")}
          </label>
          <input
            name="phone"
            type="tel"
            defaultValue={profile?.phone ?? ""}
            placeholder={t("phonePlaceholder")}
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

      <div className="mt-8">
        <CvUpload currentCvUrl={profile?.cvUrl ?? null} />
      </div>
    </div>
  );
}
