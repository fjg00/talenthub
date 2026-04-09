"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { User, FileText, Video, Target } from "lucide-react";
import { ApplicationStatusBadge } from "./status-badge";
import { updateApplicationStatusAction } from "@/lib/actions/applications";
import { useTransition } from "react";
import { AICandidateSummary } from "./ai-candidate-summary";
import { InterviewRequestButton } from "./interview-request-button";

interface Applicant {
  id: string;
  candidateId: string;
  coverLetter: string | null;
  cvUrl: string | null;
  status: string;
  createdAt: Date;
  matchPct: number;
  matchedSkills: string[];
  missingSkills: string[];
  candidate: {
    fullName: string;
    email: string;
    candidateProfile: {
      headline: string | null;
      skills: string[] | null;
      experienceYears: number | null;
      location: string | null;
    } | null;
  };
}

const statuses = [
  "applied",
  "reviewed",
  "shortlisted",
  "interview",
  "offered",
  "rejected",
  "hired",
] as const;

export function ApplicantList({ applicants, jobId }: { applicants: Applicant[]; jobId: string }) {
  const t = useTranslations("applications");

  if (applicants.length === 0) {
    return (
      <div className="py-8 text-center">
        <User className="mx-auto h-10 w-10 text-muted-foreground/30" />
        <p className="mt-2 text-sm text-muted-foreground">
          {t("noApplications")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">
        {t("title")} ({applicants.length})
      </h2>
      {applicants.map((app, i) => (
        <ApplicantCard key={app.id} applicant={app} index={i} jobId={jobId} />
      ))}
    </div>
  );
}

function ApplicantCard({
  applicant,
  index,
  jobId,
}: {
  applicant: Applicant;
  index: number;
  jobId: string;
}) {
  const t = useTranslations("applications");
  const [isPending, startTransition] = useTransition();
  const profile = applicant.candidate.candidateProfile;

  const matchColor =
    applicant.matchPct >= 75
      ? "text-success bg-success/10"
      : applicant.matchPct >= 50
        ? "text-amber-600 bg-amber-500/10 dark:text-amber-400"
        : "text-muted-foreground bg-accent";

  const matchedSet = new Set(applicant.matchedSkills.map((s) => s.toLowerCase()));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-2xl border border-border bg-card p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* Name + match badge + status */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">
              {applicant.candidate.fullName}
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${matchColor}`}>
              <Target className="h-3 w-3" />
              {applicant.matchPct}% {t("matchScore")}
            </span>
            <ApplicationStatusBadge status={applicant.status} />
          </div>

          {profile?.headline && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {profile.headline}
            </p>
          )}

          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
            {profile?.location && <span>{profile.location}</span>}
            {profile?.experienceYears != null && (
              <span>{profile.experienceYears} yrs exp</span>
            )}
            <span>
              {t("appliedOn")}{" "}
              {new Date(applicant.createdAt).toLocaleDateString("en-CA")}
            </span>
          </div>

          {/* Skills with match highlighting */}
          {profile?.skills && profile.skills.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {profile.skills.slice(0, 8).map((skill) => {
                const isMatched = matchedSet.has(skill.toLowerCase());
                return (
                  <span
                    key={skill}
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      isMatched
                        ? "bg-success/15 text-success font-medium"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {skill}
                  </span>
                );
              })}
              {profile.skills.length > 8 && (
                <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-muted-foreground">
                  +{profile.skills.length - 8}
                </span>
              )}
            </div>
          )}

          {applicant.coverLetter && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {applicant.coverLetter}
            </p>
          )}

          <div className="mt-3">
            <AICandidateSummary candidateId={applicant.candidateId} />
          </div>
        </div>

        {/* Right side: actions */}
        <div className="flex flex-col items-end gap-3">
          {/* Match score visual */}
          <div className="text-center">
            <div className={`text-2xl font-bold ${applicant.matchPct >= 75 ? "text-success" : applicant.matchPct >= 50 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
              {applicant.matchPct}%
            </div>
            <div className="text-[10px] text-muted-foreground">{t("matchScore")}</div>
          </div>

          {/* Interview request — prominent */}
          <InterviewRequestButton jobId={jobId} candidateId={applicant.candidateId} />

          {/* CV link */}
          {applicant.cvUrl && (
            <a
              href={applicant.cvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <FileText className="h-3 w-3" />
              {t("viewCV")}
            </a>
          )}

          {/* Status dropdown */}
          <select
            value={applicant.status}
            disabled={isPending}
            onChange={(e) =>
              startTransition(async () => {
                await updateApplicationStatusAction(applicant.id, e.target.value);
              })
            }
            className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none disabled:opacity-50"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {t(s)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </motion.div>
  );
}
