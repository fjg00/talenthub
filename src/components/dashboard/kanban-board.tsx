"use client";

import { useTranslations } from "next-intl";
import { useTransition, useState, useRef, useCallback } from "react";
import { updateApplicationStatusAction } from "@/lib/actions/applications";
import { Target, FileText, GripVertical } from "lucide-react";
import { InterviewRequestButton } from "./interview-request-button";
import { BulkActionsToolbar } from "./bulk-actions-toolbar";

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

const columns = [
  { id: "applied", color: "border-t-slate-400" },
  { id: "reviewed", color: "border-t-blue-400" },
  { id: "shortlisted", color: "border-t-amber-400" },
  { id: "interview", color: "border-t-purple-400" },
  { id: "offered", color: "border-t-emerald-400" },
  { id: "hired", color: "border-t-green-500" },
  { id: "rejected", color: "border-t-red-400" },
] as const;

export function KanbanBoard({
  applicants,
  jobId,
}: {
  applicants: Applicant[];
  jobId: string;
}) {
  const t = useTranslations("applications");
  const [isPending, startTransition] = useTransition();
  const [optimisticApps, setOptimisticApps] = useState(applicants);
  const dragItem = useRef<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const grouped = new Map<string, Applicant[]>();
  for (const col of columns) {
    grouped.set(col.id, []);
  }
  for (const app of optimisticApps) {
    const list = grouped.get(app.status);
    if (list) list.push(app);
  }

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  const handleOptimisticUpdate = useCallback((ids: string[], status: string) => {
    setOptimisticApps((prev) =>
      prev.map((a) => (ids.includes(a.id) ? { ...a, status } : a))
    );
  }, []);

  const handleRevert = useCallback(
    (ids: string[], previousStatuses: Map<string, string>) => {
      setOptimisticApps((prev) =>
        prev.map((a) => {
          const prevStatus = previousStatuses.get(a.id);
          return prevStatus ? { ...a, status: prevStatus } : a;
        })
      );
    },
    []
  );

  function handleDragStart(appId: string) {
    dragItem.current = appId;
  }

  function handleDragOver(e: React.DragEvent, colId: string) {
    e.preventDefault();
    setDragOverCol(colId);
  }

  function handleDragLeave() {
    setDragOverCol(null);
  }

  function handleDrop(newStatus: string) {
    const appId = dragItem.current;
    setDragOverCol(null);
    dragItem.current = null;

    if (!appId) return;

    const app = optimisticApps.find((a) => a.id === appId);
    if (!app || app.status === newStatus) return;
    // `hired` is terminal — reject drag client-side too (server also guards)
    if (app.status === "hired") return;

    // Optimistic update
    setOptimisticApps((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
    );

    startTransition(async () => {
      const result = await updateApplicationStatusAction(appId, newStatus);
      if (result.error) {
        // Revert on error
        setOptimisticApps((prev) =>
          prev.map((a) => (a.id === appId ? { ...a, status: app.status } : a))
        );
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          {t("kanbanTitle")}
        </h2>
        {isPending && (
          <span className="text-xs text-muted-foreground animate-pulse">
            {t("updating")}
          </span>
        )}
      </div>

      <BulkActionsToolbar
        selectedIds={selectedIds}
        onClearSelection={() => setSelectedIds([])}
        onOptimisticUpdate={handleOptimisticUpdate}
        onRevert={handleRevert}
        applicants={optimisticApps}
      />

      <div className="flex gap-3 overflow-x-auto pb-4">
        {columns.map((col) => {
          const items = grouped.get(col.id) ?? [];
          const isDragOver = dragOverCol === col.id;

          return (
            <div
              key={col.id}
              className={`flex w-64 shrink-0 flex-col rounded-xl border-t-4 ${col.color} border border-border bg-card ${
                isDragOver ? "ring-2 ring-primary/30 bg-primary/5" : ""
              }`}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDrop(col.id)}
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="text-xs font-semibold text-foreground">
                  {t(col.id)}
                </span>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-muted-foreground">
                  {items.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 space-y-2 px-2 pb-2 min-h-[120px]">
                {items.map((app) => (
                  <KanbanCard
                    key={app.id}
                    applicant={app}
                    jobId={jobId}
                    onDragStart={() => handleDragStart(app.id)}
                    isSelected={selectedIds.includes(app.id)}
                    onToggleSelect={() => toggleSelect(app.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KanbanCard({
  applicant,
  jobId,
  onDragStart,
  isSelected,
  onToggleSelect,
}: {
  applicant: Applicant;
  jobId: string;
  onDragStart: () => void;
  isSelected: boolean;
  onToggleSelect: () => void;
}) {
  const t = useTranslations("applications");
  const profile = applicant.candidate.candidateProfile;

  const matchColor =
    applicant.matchPct >= 75
      ? "text-success"
      : applicant.matchPct >= 50
        ? "text-amber-600 dark:text-amber-400"
        : "text-muted-foreground";

  const isLocked = applicant.status === "hired";

  return (
    <div
      draggable={!isLocked}
      onDragStart={isLocked ? undefined : onDragStart}
      title={isLocked ? t("statusLocked") : undefined}
      className={`${isLocked ? "cursor-not-allowed opacity-90" : "cursor-grab active:cursor-grabbing active:shadow-lg"} rounded-lg border bg-background p-3 shadow-sm transition-shadow hover:shadow-md ${
        isSelected
          ? "border-primary/40 ring-1 ring-primary/20"
          : "border-border"
      }`}
    >
      <div className="flex items-start gap-2">
        <div className="flex flex-col items-center gap-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            onClick={(e) => e.stopPropagation()}
            className="h-3.5 w-3.5 rounded border-border text-primary accent-primary cursor-pointer"
          />
          <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <span className="text-sm font-medium text-foreground truncate">
              {applicant.candidate.fullName}
            </span>
            <span className={`text-xs font-bold ${matchColor}`}>
              {applicant.matchPct}%
            </span>
          </div>

          {profile?.headline && (
            <p className="mt-0.5 text-[11px] text-muted-foreground truncate">
              {profile.headline}
            </p>
          )}

          <div className="mt-1.5 flex flex-wrap gap-1">
            {profile?.skills?.slice(0, 3).map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] text-muted-foreground"
              >
                {skill}
              </span>
            ))}
          </div>

          <div className="mt-2 flex items-center gap-2">
            {applicant.cvUrl && (
              <a
                href={applicant.cvUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-0.5 text-[10px] text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <FileText className="h-3 w-3" />
                CV
              </a>
            )}
            {applicant.status !== "interview" && applicant.status !== "hired" && (
              <div onClick={(e) => e.stopPropagation()}>
                <InterviewRequestButton
                  jobId={jobId}
                  candidateId={applicant.candidateId}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
