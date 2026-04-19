"use client";

import { useTranslations } from "next-intl";
import { Printer, ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { ResumeData } from "@/db/schema";

function fmtMonth(value: string): string {
  if (!value) return "";
  // value is YYYY-MM
  const [y, m] = value.split("-");
  if (!y) return value;
  if (!m) return y;
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short" });
}

function range(start: string, end: string, presentLabel: string): string {
  const s = fmtMonth(start);
  const e = end ? fmtMonth(end) : presentLabel;
  if (!s && !e) return "";
  if (!s) return e;
  return `${s} – ${e}`;
}

export function ResumePreview({ data }: { data: ResumeData }) {
  const t = useTranslations("resume");

  return (
    <>
      {/* Toolbar — hidden on print */}
      <div className="sticky top-0 z-10 mb-6 flex items-center justify-between border-b border-border bg-background/80 py-3 backdrop-blur print:hidden">
        <Link
          href="/dashboard/resume"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToEditor")}
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Printer className="h-4 w-4" />
          {t("printOrPdf")}
        </button>
      </div>

      {/* Print-specific page sizing */}
      <style>{`
        @media print {
          @page { size: A4; margin: 18mm; }
          body { background: white !important; }
        }
      `}</style>

      <article className="mx-auto max-w-3xl bg-card p-10 text-sm leading-relaxed text-foreground shadow-sm print:p-0 print:shadow-none">
        {/* Header */}
        <header className="border-b border-border pb-4">
          <h1 className="text-3xl font-bold">{data.fullName || t("yourName")}</h1>
          {data.headline && (
            <p className="mt-1 text-base text-muted-foreground">
              {data.headline}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {data.email && <span>{data.email}</span>}
            {data.phone && <span>{data.phone}</span>}
            {data.location && <span>{data.location}</span>}
            {data.links.map(
              (l) =>
                l.url && (
                  <a
                    key={l.id}
                    href={l.url}
                    className="text-primary hover:underline"
                  >
                    {l.label || l.url}
                  </a>
                )
            )}
          </div>
        </header>

        {/* Summary */}
        {data.summary && (
          <section className="mt-6">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("summary")}
            </h2>
            <p className="whitespace-pre-wrap">{data.summary}</p>
          </section>
        )}

        {/* Experience */}
        {data.experience.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("experience")}
            </h2>
            <div className="space-y-4">
              {data.experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="font-semibold">
                      {exp.title}
                      {exp.company && (
                        <span className="font-normal text-muted-foreground">
                          {" "}
                          · {exp.company}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {range(exp.start, exp.end, t("present"))}
                      {exp.location && ` · ${exp.location}`}
                    </div>
                  </div>
                  {exp.description && (
                    <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                      {exp.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("education")}
            </h2>
            <div className="space-y-3">
              {data.education.map((ed) => (
                <div key={ed.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="font-semibold">
                      {ed.degree}
                      {ed.field && (
                        <span className="font-normal">
                          {" "}
                          — {ed.field}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {range(ed.start, ed.end, t("present"))}
                    </div>
                  </div>
                  {ed.school && (
                    <div className="text-muted-foreground">{ed.school}</div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        {data.skills.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("skills")}
            </h2>
            <p>{data.skills.join(" · ")}</p>
          </section>
        )}

        {/* Languages */}
        {data.languages.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("languages")}
            </h2>
            <ul className="space-y-1">
              {data.languages.map((l) => (
                <li key={l.id}>
                  <span className="font-semibold">{l.name}</span>
                  {l.proficiency && (
                    <span className="text-muted-foreground">
                      {" "}
                      — {l.proficiency}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Certifications */}
        {data.certifications.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("certifications")}
            </h2>
            <ul className="space-y-1">
              {data.certifications.map((c) => (
                <li key={c.id}>
                  <span className="font-semibold">{c.name}</span>
                  {c.issuer && (
                    <span className="text-muted-foreground"> · {c.issuer}</span>
                  )}
                  {c.year && (
                    <span className="text-muted-foreground"> ({c.year})</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </>
  );
}
