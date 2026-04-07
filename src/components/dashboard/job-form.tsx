"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, CheckCircle } from "lucide-react";
import {
  createJobAction,
  updateJobAction,
  type JobState,
} from "@/lib/actions/jobs";

interface JobData {
  id: string;
  title: string;
  description: string;
  location: string | null;
  jobType: string | null;
  experienceLevel: string | null;
  skills: string[] | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  deadline: Date | null;
  status: string;
}

interface JobFormProps {
  job?: JobData | null;
}

const jobTypes = ["full_time", "part_time", "contract", "remote"] as const;
const experienceLevels = ["entry", "mid", "senior", "lead"] as const;
const currencies = ["USD", "SAR", "AED", "QAR", "KWD", "BHD", "OMR", "EGP"] as const;

export function JobForm({ job }: JobFormProps) {
  const t = useTranslations("jobs");
  const isEdit = !!job;

  const [state, formAction, isPending] = useActionState<JobState, FormData>(
    isEdit ? updateJobAction : createJobAction,
    {}
  );

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-8 text-2xl font-bold text-foreground">
        {isEdit ? t("editJob") : t("createJob")}
      </h1>

      {state.success && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-success/20 bg-success/10 p-3 text-sm text-success">
          <CheckCircle className="h-4 w-4" />
          {t("updated")}
        </div>
      )}

      {state.error && (
        <div className="mb-4 rounded-xl border border-error/20 bg-error/10 p-3 text-center text-sm text-error">
          {t("validationError")}
        </div>
      )}

      <form action={formAction} className="space-y-6">
        {isEdit && <input type="hidden" name="jobId" value={job.id} />}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {t("jobTitle")}
          </label>
          <input
            name="title"
            type="text"
            required
            defaultValue={job?.title ?? ""}
            placeholder={t("jobTitlePlaceholder")}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {t("description")}
          </label>
          <textarea
            name="description"
            rows={6}
            required
            defaultValue={job?.description ?? ""}
            placeholder={t("descriptionPlaceholder")}
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
            defaultValue={job?.location ?? ""}
            placeholder={t("locationPlaceholder")}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              {t("jobType")}
            </label>
            <select
              name="jobType"
              defaultValue={job?.jobType ?? ""}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">{t("allTypes")}</option>
              {jobTypes.map((type) => (
                <option key={type} value={type}>
                  {t(type)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              {t("experienceLevel")}
            </label>
            <select
              name="experienceLevel"
              defaultValue={job?.experienceLevel ?? ""}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">{t("allLevels")}</option>
              {experienceLevels.map((level) => (
                <option key={level} value={level}>
                  {t(level)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {t("skills")}
          </label>
          <input
            name="skills"
            type="text"
            defaultValue={job?.skills?.join(", ") ?? ""}
            placeholder={t("skillsPlaceholder")}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {t("salaryRange")}
          </label>
          <div className="grid grid-cols-3 gap-3">
            <input
              name="salaryMin"
              type="number"
              min={0}
              defaultValue={job?.salaryMin ?? ""}
              placeholder={t("salaryMin")}
              className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              name="salaryMax"
              type="number"
              min={0}
              defaultValue={job?.salaryMax ?? ""}
              placeholder={t("salaryMax")}
              className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <select
              name="currency"
              defaultValue={job?.currency ?? "USD"}
              className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {currencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {t("deadline")}
          </label>
          <input
            name="deadline"
            type="date"
            defaultValue={
              job?.deadline
                ? new Date(job.deadline).toISOString().split("T")[0]
                : ""
            }
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            name="status"
            value="draft"
            disabled={isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-background py-3 font-semibold text-foreground transition-colors hover:bg-accent disabled:opacity-50"
          >
            {t("saveDraft")}
          </button>
          <button
            type="submit"
            name="status"
            value="published"
            disabled={isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? t("save") : t("publish")}
          </button>
        </div>
      </form>
    </div>
  );
}
