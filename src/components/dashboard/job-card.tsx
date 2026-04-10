"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { MapPin, Clock, Building2 } from "lucide-react";
import { SaveJobButton } from "./save-job-button";

interface JobCardProps {
  job: {
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
    createdAt: Date;
    employer: {
      fullName: string;
      employerProfile: {
        companyName: string | null;
        industry: string | null;
      } | null;
    };
  };
  index: number;
  saved?: boolean;
}

export function JobCard({ job, index, saved }: JobCardProps) {
  const t = useTranslations("jobs");

  const companyName =
    job.employer.employerProfile?.companyName ?? job.employer.fullName;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        href={`/dashboard/jobs/${job.id}`}
        className="block rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/30"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-foreground">
              {job.title}
            </h3>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              {companyName}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {job.salaryMin && (
              <div className="text-end text-sm font-medium text-foreground">
                {job.salaryMin.toLocaleString()}
                {job.salaryMax ? `–${job.salaryMax.toLocaleString()}` : "+"}
                <span className="ms-1 text-xs text-muted-foreground">
                  {job.currency}
                </span>
              </div>
            )}
            {saved != null && (
              <div onClick={(e) => e.preventDefault()}>
                <SaveJobButton jobId={job.id} saved={saved} />
              </div>
            )}
          </div>
        </div>

        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
          {job.description}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {job.location && (
            <span className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs text-foreground">
              <MapPin className="h-3 w-3" />
              {job.location}
            </span>
          )}
          {job.jobType && (
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary">
              {t(job.jobType)}
            </span>
          )}
          {job.experienceLevel && (
            <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs text-foreground">
              {t(job.experienceLevel)}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {new Date(job.createdAt).toLocaleDateString("en-CA")}
          </span>
        </div>

        {job.skills && job.skills.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {job.skills.slice(0, 5).map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </Link>
    </motion.div>
  );
}
