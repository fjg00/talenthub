"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { User, FileText } from "lucide-react";
import { ApplicationStatusBadge } from "./status-badge";
import { updateApplicationStatusAction } from "@/lib/actions/applications";
import { useTransition } from "react";
import { AIMatchScore } from "./ai-match-score";
import { AICandidateSummary } from "./ai-candidate-summary";
import { InterviewRequestButton } from "./interview-request-button";

interface Applicant {
  id: string;
  candidateId: string;
  coverLetter: string | null;
  cvUrl: string | null;
  status: string;
  createdAt: Date;
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-2xl border border-border bg-card p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">
              {applicant.candidate.fullName}
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
              {new Date(applicant.createdAt).toLocaleDateString()}
            </span>
          </div>
          {profile?.skills && profile.skills.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {profile.skills.slice(0, 5).map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
          {applicant.coverLetter && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {applicant.coverLetter}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <AIMatchScore applicationId={applicant.id} jobId={jobId} />
            <AICandidateSummary candidateId={applicant.candidateId} />
            <InterviewRequestButton jobId={jobId} candidateId={applicant.candidateId} />
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {applicant.cvUrl && (
            <span className="flex items-center gap-1 text-xs text-primary">
              <FileText className="h-3 w-3" />
              {t("viewCV")}
            </span>
          )}
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
