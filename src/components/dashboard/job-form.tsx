"use client";

import { useActionState, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, CheckCircle, BookmarkPlus, Trash2 } from "lucide-react";
import {
  createJobAction,
  updateJobAction,
  type JobState,
} from "@/lib/actions/jobs";
import {
  createTemplateAction,
  deleteTemplateAction,
} from "@/lib/actions/job-templates";

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

export interface JobTemplate {
  id: string;
  name: string;
  title: string;
  description: string;
  location: string | null;
  jobType: string | null;
  experienceLevel: string | null;
  skills: string[] | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
}

interface JobFormProps {
  job?: JobData | null;
  templates?: JobTemplate[];
}

type FormSeed = {
  title: string;
  description: string;
  location: string;
  jobType: string;
  experienceLevel: string;
  skills: string;
  salaryMin: string;
  salaryMax: string;
  currency: string;
  deadline: string;
};

const jobTypes = ["full_time", "part_time", "contract", "remote"] as const;
const experienceLevels = ["entry", "mid", "senior", "lead"] as const;
const currencies = ["USD", "SAR", "AED", "QAR", "KWD", "BHD", "OMR", "EGP"] as const;

function seedFromJob(job?: JobData | null): FormSeed {
  return {
    title: job?.title ?? "",
    description: job?.description ?? "",
    location: job?.location ?? "",
    jobType: job?.jobType ?? "",
    experienceLevel: job?.experienceLevel ?? "",
    skills: job?.skills?.join(", ") ?? "",
    salaryMin: job?.salaryMin != null ? String(job.salaryMin) : "",
    salaryMax: job?.salaryMax != null ? String(job.salaryMax) : "",
    currency: job?.currency ?? "USD",
    deadline: job?.deadline
      ? new Date(job.deadline).toISOString().split("T")[0]
      : "",
  };
}

function seedFromTemplate(tpl: JobTemplate): FormSeed {
  return {
    title: tpl.title,
    description: tpl.description,
    location: tpl.location ?? "",
    jobType: tpl.jobType ?? "",
    experienceLevel: tpl.experienceLevel ?? "",
    skills: tpl.skills?.join(", ") ?? "",
    salaryMin: tpl.salaryMin != null ? String(tpl.salaryMin) : "",
    salaryMax: tpl.salaryMax != null ? String(tpl.salaryMax) : "",
    currency: tpl.currency ?? "USD",
    deadline: "",
  };
}

export function JobForm({ job, templates = [] }: JobFormProps) {
  const t = useTranslations("jobs");
  const isEdit = !!job;

  const [state, formAction, isPending] = useActionState<JobState, FormData>(
    isEdit ? updateJobAction : createJobAction,
    {}
  );

  // Remountable form via key. Seed initialized from job (edit) or empty (new).
  const [seed, setSeed] = useState<FormSeed>(() => seedFromJob(job));
  const [formKey, setFormKey] = useState(0);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  const [templateList, setTemplateList] = useState<JobTemplate[]>(templates);
  const [saveOpen, setSaveOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [tplError, setTplError] = useState<string | null>(null);
  const [isTplPending, startTplTransition] = useTransition();

  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    if (!id) return;
    const tpl = templateList.find((x) => x.id === id);
    if (!tpl) return;
    setSeed(seedFromTemplate(tpl));
    setFormKey((k) => k + 1);
  };

  const handleSaveTemplate = () => {
    setTplError(null);
    const form = document.getElementById("job-form") as HTMLFormElement | null;
    if (!form) return;
    const fd = new FormData(form);
    const name = templateName.trim();
    if (!name) {
      setTplError(t("templateNameRequired"));
      return;
    }
    const title = String(fd.get("title") ?? "").trim();
    const description = String(fd.get("description") ?? "").trim();
    if (!title || !description) {
      setTplError(t("templateFieldsRequired"));
      return;
    }
    const skillsRaw = String(fd.get("skills") ?? "");
    const skills = skillsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const salaryMinStr = String(fd.get("salaryMin") ?? "");
    const salaryMaxStr = String(fd.get("salaryMax") ?? "");
    const jobTypeVal = String(fd.get("jobType") ?? "");
    const expLevelVal = String(fd.get("experienceLevel") ?? "");
    const locationVal = String(fd.get("location") ?? "").trim();
    const currencyVal = String(fd.get("currency") ?? "USD");

    type JT = "full_time" | "part_time" | "contract" | "remote";
    type XL = "entry" | "mid" | "senior" | "lead";
    type CR =
      | "USD"
      | "SAR"
      | "AED"
      | "QAR"
      | "KWD"
      | "BHD"
      | "OMR"
      | "EGP";

    const jobTypeParsed = (
      jobTypes.includes(jobTypeVal as JT) ? (jobTypeVal as JT) : null
    ) as JT | null;
    const expLevelParsed = (
      experienceLevels.includes(expLevelVal as XL) ? (expLevelVal as XL) : null
    ) as XL | null;
    const currencyParsed = (
      currencies.includes(currencyVal as CR) ? (currencyVal as CR) : "USD"
    ) as CR;

    startTplTransition(async () => {
      const res = await createTemplateAction({
        name,
        title,
        description,
        location: locationVal || null,
        jobType: jobTypeParsed,
        experienceLevel: expLevelParsed,
        skills,
        salaryMin: salaryMinStr ? Number(salaryMinStr) : null,
        salaryMax: salaryMaxStr ? Number(salaryMaxStr) : null,
        currency: currencyParsed,
      });
      if (res.error) {
        setTplError(t("validationError"));
        return;
      }
      if (res.templateId) {
        setTemplateList((prev) => [
          {
            id: res.templateId!,
            name,
            title,
            description,
            location: locationVal || null,
            jobType: jobTypeParsed,
            experienceLevel: expLevelParsed,
            skills,
            salaryMin: salaryMinStr ? Number(salaryMinStr) : null,
            salaryMax: salaryMaxStr ? Number(salaryMaxStr) : null,
            currency: currencyParsed,
          },
          ...prev,
        ]);
      }
      setTemplateName("");
      setSaveOpen(false);
    });
  };

  const handleDeleteTemplate = (id: string) => {
    startTplTransition(async () => {
      const res = await deleteTemplateAction(id);
      if (res.success) {
        setTemplateList((prev) => prev.filter((t) => t.id !== id));
        if (selectedTemplateId === id) setSelectedTemplateId("");
      }
    });
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-8 text-2xl font-bold text-foreground">
        {isEdit ? t("editJob") : t("createJob")}
      </h1>

      {!isEdit && (
        <div className="mb-6 rounded-2xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">
              {t("loadFromTemplate")}
            </label>
            <button
              type="button"
              onClick={() => setSaveOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
            >
              <BookmarkPlus className="h-3.5 w-3.5" />
              {t("saveAsTemplate")}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedTemplateId}
              onChange={(e) => handleSelectTemplate(e.target.value)}
              className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">{t("noTemplate")}</option>
              {templateList.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name}
                </option>
              ))}
            </select>
            {selectedTemplateId && (
              <button
                type="button"
                onClick={() => handleDeleteTemplate(selectedTemplateId)}
                disabled={isTplPending}
                aria-label={t("deleteTemplate")}
                className="rounded-lg border border-border bg-background p-2.5 text-error hover:bg-error/10 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          {saveOpen && (
            <div className="mt-3 space-y-2 rounded-xl border border-border bg-background p-3">
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder={t("templateNamePlaceholder")}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {tplError && (
                <p className="text-xs text-error">{tplError}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSaveOpen(false);
                    setTplError(null);
                    setTemplateName("");
                  }}
                  className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
                >
                  {t("cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleSaveTemplate}
                  disabled={isTplPending}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {isTplPending && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  {t("saveTemplate")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

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

      <form
        id="job-form"
        key={formKey}
        action={formAction}
        className="space-y-6"
      >
        {isEdit && <input type="hidden" name="jobId" value={job.id} />}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {t("jobTitle")}
          </label>
          <input
            name="title"
            type="text"
            required
            defaultValue={seed.title}
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
            defaultValue={seed.description}
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
            defaultValue={seed.location}
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
              defaultValue={seed.jobType}
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
              defaultValue={seed.experienceLevel}
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
            defaultValue={seed.skills}
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
              defaultValue={seed.salaryMin}
              placeholder={t("salaryMin")}
              className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              name="salaryMax"
              type="number"
              min={0}
              defaultValue={seed.salaryMax}
              placeholder={t("salaryMax")}
              className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <select
              name="currency"
              defaultValue={seed.currency}
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
            defaultValue={seed.deadline}
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
