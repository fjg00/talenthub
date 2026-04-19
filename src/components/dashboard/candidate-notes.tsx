"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition, useEffect } from "react";
import {
  StickyNote,
  X,
  Loader2,
  Trash2,
  Pencil,
  Check,
  Lock,
} from "lucide-react";
import {
  createCandidateNoteAction,
  updateCandidateNoteAction,
  deleteCandidateNoteAction,
  getMyNotesForCandidateAction,
} from "@/lib/actions/candidate-notes";

interface Note {
  id: string;
  content: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export function CandidateNotesButton({
  candidateId,
  candidateName,
  initialCount = 0,
}: {
  candidateId: string;
  candidateName: string;
  initialCount?: number;
}) {
  const t = useTranslations("candidateNotes");
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(initialCount);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
        title={t("title")}
      >
        <StickyNote className="h-3 w-3" />
        {t("notes")}
        {count > 0 && (
          <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/15 px-1 text-[10px] font-bold text-primary">
            {count}
          </span>
        )}
      </button>

      {open && (
        <CandidateNotesModal
          candidateId={candidateId}
          candidateName={candidateName}
          onClose={() => setOpen(false)}
          onCountChange={setCount}
        />
      )}
    </>
  );
}

function CandidateNotesModal({
  candidateId,
  candidateName,
  onClose,
  onCountChange,
}: {
  candidateId: string;
  candidateName: string;
  onClose: () => void;
  onCountChange: (n: number) => void;
}) {
  const t = useTranslations("candidateNotes");
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  // Load notes on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await getMyNotesForCandidateAction(candidateId);
      if (cancelled) return;
      if ("error" in res && res.error) {
        setError(res.error);
      }
      setNotes(res.notes as Note[]);
      onCountChange(res.notes.length);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [candidateId, onCountChange]);

  function handleCreate() {
    const content = newContent.trim();
    if (!content) return;
    setError("");

    startTransition(async () => {
      const res = await createCandidateNoteAction(candidateId, content);
      if (res.error) {
        setError(res.error);
        return;
      }
      // Refetch
      const refreshed = await getMyNotesForCandidateAction(candidateId);
      setNotes(refreshed.notes as Note[]);
      onCountChange(refreshed.notes.length);
      setNewContent("");
    });
  }

  function handleStartEdit(note: Note) {
    setEditingId(note.id);
    setEditingContent(note.content);
    setError("");
  }

  function handleSaveEdit() {
    if (!editingId) return;
    const content = editingContent.trim();
    if (!content) return;
    setError("");

    startTransition(async () => {
      const res = await updateCandidateNoteAction(editingId, content);
      if (res.error) {
        setError(res.error);
        return;
      }
      setNotes((prev) =>
        prev.map((n) =>
          n.id === editingId
            ? { ...n, content, updatedAt: new Date().toISOString() }
            : n
        )
      );
      setEditingId(null);
      setEditingContent("");
    });
  }

  function handleDelete(noteId: string) {
    setError("");
    startTransition(async () => {
      const res = await deleteCandidateNoteAction(noteId);
      if (res.error) {
        setError(res.error);
        return;
      }
      setNotes((prev) => {
        const next = prev.filter((n) => n.id !== noteId);
        onCountChange(next.length);
        return next;
      });
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl max-h-[85vh] flex flex-col">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <StickyNote className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">
                {t("title")}
              </h3>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {t("about")} <strong>{candidateName}</strong>
            </p>
            <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
              <Lock className="h-3 w-3" />
              {t("privacyNotice")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* New note */}
        <div className="mt-4">
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder={t("placeholder")}
            rows={3}
            maxLength={5000}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              {newContent.length}/5000
            </span>
            <button
              onClick={handleCreate}
              disabled={isPending || !newContent.trim()}
              className="flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <StickyNote className="h-3.5 w-3.5" />
              )}
              {t("addNote")}
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-2 text-sm text-red-500">
            {error === "Unauthorized" ? t("errorUnauthorized") : error}
          </p>
        )}

        {/* Notes list */}
        <div className="mt-4 flex-1 overflow-y-auto border-t border-border pt-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : notes.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <StickyNote className="mx-auto h-8 w-8 text-muted-foreground/30" />
              <p className="mt-2">{t("noNotes")}</p>
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="rounded-lg border border-border bg-background p-3"
              >
                {editingId === note.id ? (
                  <div>
                    <textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      rows={3}
                      maxLength={5000}
                      className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none resize-none"
                    />
                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditingContent("");
                        }}
                        disabled={isPending}
                        className="rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-accent disabled:opacity-50"
                      >
                        {t("cancel")}
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        disabled={isPending || !editingContent.trim()}
                        className="flex items-center gap-1 rounded-lg bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                      >
                        <Check className="h-3 w-3" />
                        {t("save")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="whitespace-pre-wrap text-sm text-foreground">
                      {note.content}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(note.createdAt).toLocaleString("en-CA", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                        {new Date(note.updatedAt).getTime() -
                          new Date(note.createdAt).getTime() >
                          1000 && <span className="ml-1">• {t("edited")}</span>}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStartEdit(note)}
                          disabled={isPending}
                          className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
                          title={t("edit")}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(note.id)}
                          disabled={isPending}
                          className="rounded p-1 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
                          title={t("delete")}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
