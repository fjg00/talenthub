"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  Plus,
  Trash2,
  Save,
  Eye,
  CheckCircle,
  Loader2,
  Briefcase,
  GraduationCap,
  Languages,
  Award,
  LinkIcon,
  X,
} from "lucide-react";
import type {
  ResumeData,
  ExperienceEntry,
  EducationEntry,
  LanguageEntry,
  CertificationEntry,
  LinkEntry,
} from "@/db/schema";
import { saveResumeAction } from "@/lib/actions/resumes";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const INPUT_CLS =
  "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
const SMALL_INPUT_CLS =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

export function ResumeBuilder({ initialData }: { initialData: ResumeData }) {
  const t = useTranslations("resume");
  const [data, setData] = useState<ResumeData>(initialData);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skillInput, setSkillInput] = useState("");

  function patch<K extends keyof ResumeData>(key: K, value: ResumeData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  const addExperience = () =>
    patch("experience", [
      ...data.experience,
      {
        id: uid(),
        title: "",
        company: "",
        location: "",
        start: "",
        end: "",
        description: "",
      },
    ]);
  const updateExperience = (id: string, upd: Partial<ExperienceEntry>) =>
    patch(
      "experience",
      data.experience.map((e) => (e.id === id ? { ...e, ...upd } : e))
    );
  const removeExperience = (id: string) =>
    patch(
      "experience",
      data.experience.filter((e) => e.id !== id)
    );

  const addEducation = () =>
    patch("education", [
      ...data.education,
      {
        id: uid(),
        school: "",
        degree: "",
        field: "",
        start: "",
        end: "",
      },
    ]);
  const updateEducation = (id: string, upd: Partial<EducationEntry>) =>
    patch(
      "education",
      data.education.map((e) => (e.id === id ? { ...e, ...upd } : e))
    );
  const removeEducation = (id: string) =>
    patch(
      "education",
      data.education.filter((e) => e.id !== id)
    );

  const addLanguage = () =>
    patch("languages", [
      ...data.languages,
      { id: uid(), name: "", proficiency: "" },
    ]);
  const updateLanguage = (id: string, upd: Partial<LanguageEntry>) =>
    patch(
      "languages",
      data.languages.map((l) => (l.id === id ? { ...l, ...upd } : l))
    );
  const removeLanguage = (id: string) =>
    patch(
      "languages",
      data.languages.filter((l) => l.id !== id)
    );

  const addCertification = () =>
    patch("certifications", [
      ...data.certifications,
      { id: uid(), name: "", issuer: "", year: "" },
    ]);
  const updateCertification = (id: string, upd: Partial<CertificationEntry>) =>
    patch(
      "certifications",
      data.certifications.map((c) => (c.id === id ? { ...c, ...upd } : c))
    );
  const removeCertification = (id: string) =>
    patch(
      "certifications",
      data.certifications.filter((c) => c.id !== id)
    );

  const addLink = () =>
    patch("links", [...data.links, { id: uid(), label: "", url: "" }]);
  const updateLink = (id: string, upd: Partial<LinkEntry>) =>
    patch(
      "links",
      data.links.map((l) => (l.id === id ? { ...l, ...upd } : l))
    );
  const removeLink = (id: string) =>
    patch(
      "links",
      data.links.filter((l) => l.id !== id)
    );

  const addSkill = () => {
    const v = skillInput.trim();
    if (!v || data.skills.includes(v)) {
      setSkillInput("");
      return;
    }
    patch("skills", [...data.skills, v]);
    setSkillInput("");
  };
  const removeSkill = (s: string) =>
    patch(
      "skills",
      data.skills.filter((x) => x !== s)
    );

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const res = await saveResumeAction(data);
      if (res.error) {
        setError(t("validationError"));
        return;
      }
      setSaved(true);
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/dashboard/resume/preview"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-accent"
          >
            <Eye className="h-4 w-4" />
            {t("preview")}
          </a>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {t("save")}
          </button>
        </div>
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-xl border border-success/20 bg-success/10 p-3 text-sm text-success">
          <CheckCircle className="h-4 w-4" />
          {t("saved")}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-error/20 bg-error/10 p-3 text-sm text-error">
          {error}
        </div>
      )}

      {/* Personal info */}
      <Section title={t("personalInfo")}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            className={INPUT_CLS}
            placeholder={t("fullName")}
            value={data.fullName}
            onChange={(e) => patch("fullName", e.target.value)}
          />
          <input
            className={INPUT_CLS}
            placeholder={t("headline")}
            value={data.headline}
            onChange={(e) => patch("headline", e.target.value)}
          />
          <input
            className={INPUT_CLS}
            placeholder={t("email")}
            value={data.email}
            onChange={(e) => patch("email", e.target.value)}
          />
          <input
            className={INPUT_CLS}
            placeholder={t("phone")}
            value={data.phone}
            onChange={(e) => patch("phone", e.target.value)}
          />
          <input
            className={`${INPUT_CLS} sm:col-span-2`}
            placeholder={t("location")}
            value={data.location}
            onChange={(e) => patch("location", e.target.value)}
          />
        </div>
      </Section>

      {/* Summary */}
      <Section title={t("summary")}>
        <textarea
          rows={4}
          className={INPUT_CLS}
          placeholder={t("summaryPlaceholder")}
          value={data.summary}
          onChange={(e) => patch("summary", e.target.value)}
        />
      </Section>

      {/* Experience */}
      <Section
        title={t("experience")}
        icon={<Briefcase className="h-4 w-4" />}
        onAdd={addExperience}
        addLabel={t("addExperience")}
      >
        {data.experience.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("noExperience")}</p>
        )}
        <div className="space-y-4">
          {data.experience.map((exp) => (
            <div
              key={exp.id}
              className="rounded-xl border border-border bg-background p-3"
            >
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                  className={SMALL_INPUT_CLS}
                  placeholder={t("jobTitle")}
                  value={exp.title}
                  onChange={(e) =>
                    updateExperience(exp.id, { title: e.target.value })
                  }
                />
                <input
                  className={SMALL_INPUT_CLS}
                  placeholder={t("company")}
                  value={exp.company}
                  onChange={(e) =>
                    updateExperience(exp.id, { company: e.target.value })
                  }
                />
                <input
                  className={SMALL_INPUT_CLS}
                  placeholder={t("location")}
                  value={exp.location}
                  onChange={(e) =>
                    updateExperience(exp.id, { location: e.target.value })
                  }
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className={SMALL_INPUT_CLS}
                    placeholder={t("startDate")}
                    type="month"
                    value={exp.start}
                    onChange={(e) =>
                      updateExperience(exp.id, { start: e.target.value })
                    }
                  />
                  <input
                    className={SMALL_INPUT_CLS}
                    placeholder={t("endDate")}
                    type="month"
                    value={exp.end}
                    onChange={(e) =>
                      updateExperience(exp.id, { end: e.target.value })
                    }
                  />
                </div>
              </div>
              <textarea
                rows={3}
                className={`${SMALL_INPUT_CLS} mt-2`}
                placeholder={t("descriptionPlaceholder")}
                value={exp.description}
                onChange={(e) =>
                  updateExperience(exp.id, { description: e.target.value })
                }
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => removeExperience(exp.id)}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-error hover:bg-error/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t("remove")}
                </button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Education */}
      <Section
        title={t("education")}
        icon={<GraduationCap className="h-4 w-4" />}
        onAdd={addEducation}
        addLabel={t("addEducation")}
      >
        {data.education.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("noEducation")}</p>
        )}
        <div className="space-y-4">
          {data.education.map((ed) => (
            <div
              key={ed.id}
              className="rounded-xl border border-border bg-background p-3"
            >
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                  className={SMALL_INPUT_CLS}
                  placeholder={t("school")}
                  value={ed.school}
                  onChange={(e) =>
                    updateEducation(ed.id, { school: e.target.value })
                  }
                />
                <input
                  className={SMALL_INPUT_CLS}
                  placeholder={t("degree")}
                  value={ed.degree}
                  onChange={(e) =>
                    updateEducation(ed.id, { degree: e.target.value })
                  }
                />
                <input
                  className={SMALL_INPUT_CLS}
                  placeholder={t("field")}
                  value={ed.field}
                  onChange={(e) =>
                    updateEducation(ed.id, { field: e.target.value })
                  }
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className={SMALL_INPUT_CLS}
                    type="month"
                    value={ed.start}
                    onChange={(e) =>
                      updateEducation(ed.id, { start: e.target.value })
                    }
                  />
                  <input
                    className={SMALL_INPUT_CLS}
                    type="month"
                    value={ed.end}
                    onChange={(e) =>
                      updateEducation(ed.id, { end: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => removeEducation(ed.id)}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-error hover:bg-error/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t("remove")}
                </button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Skills */}
      <Section title={t("skills")}>
        <div className="flex gap-2">
          <input
            className={INPUT_CLS}
            placeholder={t("skillsPlaceholder")}
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSkill();
              }
            }}
          />
          <button
            type="button"
            onClick={addSkill}
            className="rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-accent"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {data.skills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {data.skills.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
              >
                {s}
                <button
                  type="button"
                  onClick={() => removeSkill(s)}
                  className="text-primary/70 hover:text-primary"
                  aria-label={t("remove")}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </Section>

      {/* Languages */}
      <Section
        title={t("languages")}
        icon={<Languages className="h-4 w-4" />}
        onAdd={addLanguage}
        addLabel={t("addLanguage")}
      >
        <div className="space-y-2">
          {data.languages.map((l) => (
            <div key={l.id} className="flex gap-2">
              <input
                className={SMALL_INPUT_CLS}
                placeholder={t("languageName")}
                value={l.name}
                onChange={(e) =>
                  updateLanguage(l.id, { name: e.target.value })
                }
              />
              <input
                className={SMALL_INPUT_CLS}
                placeholder={t("proficiency")}
                value={l.proficiency}
                onChange={(e) =>
                  updateLanguage(l.id, { proficiency: e.target.value })
                }
              />
              <button
                type="button"
                onClick={() => removeLanguage(l.id)}
                className="shrink-0 rounded-lg border border-border bg-background p-2 text-error hover:bg-error/10"
                aria-label={t("remove")}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </Section>

      {/* Certifications */}
      <Section
        title={t("certifications")}
        icon={<Award className="h-4 w-4" />}
        onAdd={addCertification}
        addLabel={t("addCertification")}
      >
        <div className="space-y-2">
          {data.certifications.map((c) => (
            <div
              key={c.id}
              className="grid grid-cols-1 gap-2 rounded-xl border border-border bg-background p-3 sm:grid-cols-[1fr,1fr,auto,auto]"
            >
              <input
                className={SMALL_INPUT_CLS}
                placeholder={t("certName")}
                value={c.name}
                onChange={(e) =>
                  updateCertification(c.id, { name: e.target.value })
                }
              />
              <input
                className={SMALL_INPUT_CLS}
                placeholder={t("certIssuer")}
                value={c.issuer}
                onChange={(e) =>
                  updateCertification(c.id, { issuer: e.target.value })
                }
              />
              <input
                className={`${SMALL_INPUT_CLS} sm:w-24`}
                placeholder={t("certYear")}
                value={c.year}
                onChange={(e) =>
                  updateCertification(c.id, { year: e.target.value })
                }
              />
              <button
                type="button"
                onClick={() => removeCertification(c.id)}
                className="rounded-lg border border-border bg-background p-2 text-error hover:bg-error/10"
                aria-label={t("remove")}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </Section>

      {/* Links */}
      <Section
        title={t("links")}
        icon={<LinkIcon className="h-4 w-4" />}
        onAdd={addLink}
        addLabel={t("addLink")}
      >
        <div className="space-y-2">
          {data.links.map((l) => (
            <div key={l.id} className="flex gap-2">
              <input
                className={`${SMALL_INPUT_CLS} sm:max-w-[180px]`}
                placeholder={t("linkLabel")}
                value={l.label}
                onChange={(e) => updateLink(l.id, { label: e.target.value })}
              />
              <input
                className={SMALL_INPUT_CLS}
                placeholder="https://"
                value={l.url}
                onChange={(e) => updateLink(l.id, { url: e.target.value })}
              />
              <button
                type="button"
                onClick={() => removeLink(l.id)}
                className="shrink-0 rounded-lg border border-border bg-background p-2 text-error hover:bg-error/10"
                aria-label={t("remove")}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
  onAdd,
  addLabel,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onAdd?: () => void;
  addLabel?: string;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          {icon}
          {title}
        </h2>
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
          >
            <Plus className="h-3.5 w-3.5" />
            {addLabel}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}
