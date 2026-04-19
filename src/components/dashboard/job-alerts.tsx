"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  Bell,
  BellOff,
  Plus,
  Trash2,
  Edit,
  Loader2,
  CheckCircle,
  X,
} from "lucide-react";
import {
  createAlertAction,
  updateAlertAction,
  toggleAlertAction,
  deleteAlertAction,
  type AlertInput,
} from "@/lib/actions/job-alerts";

type Alert = {
  id: string;
  name: string;
  keyword: string | null;
  location: string | null;
  jobType: string | null;
  experienceLevel: string | null;
  skills: string[];
  salaryMin: number | null;
  currency: string | null;
  frequency: string;
  enabled: boolean;
  lastSentAt: Date | null;
};

const jobTypes = ["full_time", "part_time", "contract", "remote"] as const;
const experienceLevels = ["entry", "mid", "senior", "lead"] as const;
const currencies = ["USD", "SAR", "AED", "QAR", "KWD", "BHD", "OMR", "EGP"] as const;

const INPUT_CLS =
  "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

export function JobAlertsPage({ alerts: initial }: { alerts: Alert[] }) {
  const t = useTranslations("alerts");
  const tj = useTranslations("jobs");
  const [alerts, setAlerts] = useState(initial);
  const [editing, setEditing] = useState<Alert | null>(null);
  const [creating, setCreating] = useState(false);

  const handleToggle = (id: string, enabled: boolean) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled } : a))
    );
    toggleAlertAction(id, enabled).catch(() => {});
  };

  const handleDelete = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    deleteAlertAction(id).catch(() => {});
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setCreating(true);
            setEditing(null);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          {t("createAlert")}
        </button>
      </div>

      {creating && (
        <AlertForm
          initial={null}
          onClose={() => setCreating(false)}
          onSaved={(newAlert) => {
            setAlerts((prev) => [newAlert, ...prev]);
            setCreating(false);
          }}
        />
      )}

      {editing && (
        <AlertForm
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setAlerts((prev) =>
              prev.map((a) => (a.id === updated.id ? updated : a))
            );
            setEditing(null);
          }}
        />
      )}

      {alerts.length === 0 && !creating ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 py-12 text-center">
          <Bell className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <p className="mt-3 text-sm text-muted-foreground">{t("noAlerts")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => (
            <div
              key={a.id}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {a.enabled ? (
                      <Bell className="h-4 w-4 text-primary" />
                    ) : (
                      <BellOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <h3 className="font-semibold text-foreground">{a.name}</h3>
                    <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {t(a.frequency as "daily" | "weekly")}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {a.keyword && <span>&ldquo;{a.keyword}&rdquo;</span>}
                    {a.location && <span>· {a.location}</span>}
                    {a.jobType && <span>· {tj(a.jobType as "full_time" | "part_time" | "contract" | "remote")}</span>}
                    {a.experienceLevel && (
                      <span>· {tj(a.experienceLevel as "entry" | "mid" | "senior" | "lead")}</span>
                    )}
                    {a.salaryMin != null && (
                      <span>
                        · {a.salaryMin.toLocaleString()}+ {a.currency ?? ""}
                      </span>
                    )}
                    {a.skills.length > 0 && (
                      <span>· {a.skills.join(", ")}</span>
                    )}
                  </div>
                  {a.lastSentAt && (
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {t("lastSent")}{" "}
                      {new Date(a.lastSentAt).toLocaleDateString("en-CA")}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <label className="flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-accent">
                    <input
                      type="checkbox"
                      checked={a.enabled}
                      onChange={(e) => handleToggle(a.id, e.target.checked)}
                      className="h-3 w-3"
                    />
                    {a.enabled ? t("enabled") : t("disabled")}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(a);
                      setCreating(false);
                    }}
                    aria-label={t("edit")}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(a.id)}
                    aria-label={t("delete")}
                    className="rounded-lg p-1.5 text-error hover:bg-error/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AlertForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: Alert | null;
  onClose: () => void;
  onSaved: (a: Alert) => void;
}) {
  const t = useTranslations("alerts");
  const tj = useTranslations("jobs");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(initial?.name ?? "");
  const [keyword, setKeyword] = useState(initial?.keyword ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [jobType, setJobType] = useState(initial?.jobType ?? "");
  const [experienceLevel, setExperienceLevel] = useState(
    initial?.experienceLevel ?? ""
  );
  const [skills, setSkills] = useState((initial?.skills ?? []).join(", "));
  const [salaryMin, setSalaryMin] = useState(
    initial?.salaryMin != null ? String(initial.salaryMin) : ""
  );
  const [currency, setCurrency] = useState(initial?.currency ?? "USD");
  const [frequency, setFrequency] = useState<"daily" | "weekly">(
    (initial?.frequency as "daily" | "weekly") ?? "daily"
  );

  const handleSubmit = () => {
    setError(null);
    if (!name.trim()) {
      setError(t("nameRequired"));
      return;
    }

    const skillsList = skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const input: AlertInput = {
      name: name.trim(),
      keyword: keyword.trim() || null,
      location: location.trim() || null,
      jobType: (jobType ||
        null) as AlertInput["jobType"],
      experienceLevel: (experienceLevel ||
        null) as AlertInput["experienceLevel"],
      skills: skillsList,
      salaryMin: salaryMin ? Number(salaryMin) : null,
      currency: (currency || null) as AlertInput["currency"],
      frequency,
    };

    startTransition(async () => {
      const res = initial
        ? await updateAlertAction(initial.id, input)
        : await createAlertAction(input);

      if (res.error) {
        setError(t("validationError"));
        return;
      }

      const saved: Alert = {
        id: initial?.id ?? res.alertId ?? "",
        name: input.name,
        keyword: input.keyword ?? null,
        location: input.location ?? null,
        jobType: input.jobType ?? null,
        experienceLevel: input.experienceLevel ?? null,
        skills: input.skills ?? [],
        salaryMin: input.salaryMin ?? null,
        currency: input.currency ?? null,
        frequency: input.frequency ?? "daily",
        enabled: initial?.enabled ?? true,
        lastSentAt: initial?.lastSentAt ?? null,
      };
      onSaved(saved);
    });
  };

  return (
    <div className="mb-4 rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          {initial ? t("editAlert") : t("createAlert")}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent"
          aria-label={t("close")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        <input
          className={INPUT_CLS}
          placeholder={t("namePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className={INPUT_CLS}
          placeholder={t("keywordPlaceholder")}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <input
          className={INPUT_CLS}
          placeholder={t("locationPlaceholder")}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select
            className={INPUT_CLS}
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
          >
            <option value="">{tj("allTypes")}</option>
            {jobTypes.map((x) => (
              <option key={x} value={x}>
                {tj(x)}
              </option>
            ))}
          </select>
          <select
            className={INPUT_CLS}
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
          >
            <option value="">{tj("allLevels")}</option>
            {experienceLevels.map((x) => (
              <option key={x} value={x}>
                {tj(x)}
              </option>
            ))}
          </select>
        </div>
        <input
          className={INPUT_CLS}
          placeholder={t("skillsPlaceholder")}
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            min={0}
            className={INPUT_CLS}
            placeholder={t("minSalaryPlaceholder")}
            value={salaryMin}
            onChange={(e) => setSalaryMin(e.target.value)}
          />
          <select
            className={INPUT_CLS}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {currencies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {t("frequency")}
          </label>
          <div className="flex gap-2">
            {(["daily", "weekly"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFrequency(f)}
                className={`flex-1 rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                  frequency === f
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:bg-accent"
                }`}
              >
                {t(f)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded-xl border border-error/20 bg-error/10 p-2.5 text-sm text-error">
          {error}
        </p>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
        >
          {t("cancel")}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          {t("save")}
        </button>
      </div>
    </div>
  );
}
