"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { FileText, Building2 } from "lucide-react";
import { ApplicationStatusBadge } from "./status-badge";

interface Application {
  id: string;
  coverLetter: string | null;
  status: string;
  createdAt: Date;
  job: {
    id: string;
    title: string;
    location: string | null;
    employer: {
      fullName: string;
      employerProfile: {
        companyName: string | null;
      } | null;
    };
  };
}

export function CandidateApplications({
  applications,
}: {
  applications: Application[];
}) {
  const t = useTranslations("applications");

  if (applications.length === 0) {
    return (
      <div className="py-16 text-center">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground/30" />
        <h2 className="mt-4 text-lg font-semibold text-foreground">
          {t("noApplications")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("noApplicationsDesc")}
        </p>
        <Link
          href="/dashboard/jobs"
          className="mt-6 inline-block rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {useTranslations("jobs")("browseJobs")}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">{t("title")}</h1>
      <div className="space-y-4">
        {applications.map((app, i) => (
          <motion.div
            key={app.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/dashboard/jobs/${app.job.id}`}
                  className="text-lg font-semibold text-foreground hover:text-primary"
                >
                  {app.job.title}
                </Link>
                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" />
                  {app.job.employer.employerProfile?.companyName ??
                    app.job.employer.fullName}
                  {app.job.location && (
                    <>
                      <span>·</span>
                      <span>{app.job.location}</span>
                    </>
                  )}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {t("appliedOn")}{" "}
                  {new Date(app.createdAt).toLocaleDateString("en-CA")}
                </div>
              </div>
              <ApplicationStatusBadge status={app.status} />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
