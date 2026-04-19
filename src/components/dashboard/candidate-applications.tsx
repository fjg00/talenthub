"use client";

import { useState, useTransition } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Building2,
  ChevronDown,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { ApplicationStatusBadge } from "./status-badge";
import { ApplicationTimeline, type TimelineEntry } from "./application-timeline";
import { withdrawApplicationAction } from "@/lib/actions/applications";

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

type HistoryMap = Record<string, TimelineEntry[]>;

export function CandidateApplications({
  applications,
  histories = {},
}: {
  applications: Application[];
  histories?: HistoryMap;
}) {
  const t = useTranslations("applications");
  const tj = useTranslations("jobs");
  const fmt = useFormatter();
  const [openId, setOpenId] = useState<string | null>(null);

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
          {tj("browseJobs")}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">{t("title")}</h1>
      <div className="space-y-4">
        {applications.map((app, i) => {
          const isOpen = openId === app.id;
          const entries: TimelineEntry[] =
            histories[app.id]?.length > 0
              ? histories[app.id]
              : [
                  {
                    id: `synthetic-${app.id}`,
                    status: "applied",
                    note: null,
                    createdAt: app.createdAt,
                  },
                ];

          return (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-border bg-card"
            >
              <div className="flex items-start justify-between gap-4 p-5">
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
                    {fmt.dateTime(new Date(app.createdAt), { dateStyle: "medium" })}
                  </div>
                </div>
                <ApplicationStatusBadge status={app.status} />
              </div>

              <div className="flex items-stretch border-t border-border">
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : app.id)}
                  className="flex flex-1 items-center justify-between px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                  aria-expanded={isOpen}
                >
                  <span>{t("timeline")}</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {app.status !== "hired" && app.status !== "rejected" && (
                  <WithdrawButton applicationId={app.id} />
                )}
              </div>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border px-5 py-4">
                      <ApplicationTimeline
                        entries={entries}
                        currentStatus={app.status}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function WithdrawButton({ applicationId }: { applicationId: string }) {
  const t = useTranslations("applications");
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleWithdraw() {
    setError(null);
    startTransition(async () => {
      const res = await withdrawApplicationAction(applicationId);
      if (res.error) {
        setError(t(res.error));
      }
      // Server revalidates — list reloads without this row.
    });
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="flex items-center gap-1.5 border-s border-border px-4 text-xs font-medium text-muted-foreground transition-colors hover:bg-error/5 hover:text-error"
      >
        <X className="h-3.5 w-3.5" />
        {t("withdraw")}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 border-s border-border bg-error/5 px-4 py-2">
      <AlertCircle className="h-3.5 w-3.5 shrink-0 text-error" />
      <span className="text-xs text-foreground">{t("withdrawConfirm")}</span>
      <button
        type="button"
        onClick={handleWithdraw}
        disabled={isPending}
        className="inline-flex items-center gap-1 rounded-md bg-error px-2 py-1 text-xs font-medium text-white hover:bg-error/90 disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : null}
        {t("yesWithdraw")}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={isPending}
        className="rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-foreground hover:bg-accent disabled:opacity-50"
      >
        {t("cancel")}
      </button>
      {error && (
        <span role="alert" className="text-xs text-error">
          {error}
        </span>
      )}
    </div>
  );
}
