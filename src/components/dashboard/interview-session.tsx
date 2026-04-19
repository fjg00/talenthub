"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  CheckCircle,
  ChevronRight,
  Upload,
  Loader2,
} from "lucide-react";
import { VideoRecorder } from "./video-recorder";
import {
  startInterviewAction,
  submitResponseAction,
  completeInterviewAction,
} from "@/lib/actions/interviews";

interface InterviewSessionProps {
  interviewId: string;
  questions: { text: string; category: string }[];
  status: string;
  jobTitle: string;
}

export function InterviewSession({
  interviewId,
  questions,
  status: initialStatus,
  jobTitle,
}: InterviewSessionProps) {
  const t = useTranslations("interview");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [status, setStatus] = useState(initialStatus);
  const [isUploading, setIsUploading] = useState(false);
  const [completed, setCompleted] = useState<number[]>([]);
  const [isPending, startTransition] = useTransition();

  function handleStart() {
    startTransition(async () => {
      const res = await startInterviewAction(interviewId);
      if (res.success) setStatus("in_progress");
    });
  }

  async function handleRecordingComplete(
    videoBlob: Blob,
    transcript: string,
    durationSeconds: number
  ) {
    setIsUploading(true);

    // Upload video to Supabase Storage via a presigned approach
    // For now, we'll create a FormData and post to an API route
    const formData = new FormData();
    formData.append("video", videoBlob, `q${currentQuestion}.webm`);
    formData.append("interviewId", interviewId);
    formData.append("questionIndex", currentQuestion.toString());

    let videoUrl = "";
    try {
      const uploadRes = await fetch("/api/interviews/upload", {
        method: "POST",
        body: formData,
      });
      const data = await uploadRes.json();
      videoUrl = data.videoUrl ?? "";
    } catch {
      // Upload failed — continue with empty URL
    }

    // Submit the response
    await submitResponseAction(
      interviewId,
      currentQuestion,
      videoUrl,
      transcript,
      durationSeconds
    );

    setCompleted((prev) => [...prev, currentQuestion]);
    setIsUploading(false);

    // Auto-advance to next question or complete
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  }

  async function handleComplete() {
    startTransition(async () => {
      const res = await completeInterviewAction(interviewId);
      if (res.success) setStatus("completed");
    });
  }

  const allAnswered = completed.length === questions.length;

  // Pending state — show start button
  if (status === "pending") {
    return (
      <div className="mx-auto max-w-2xl space-y-6 text-center">
        <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-purple-500/5 p-8">
          <Sparkles className="mx-auto h-12 w-12 text-violet-500" />
          <h2 className="mt-4 text-xl font-bold text-foreground">
            {t("aiInterview")}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {t("interviewIntro", { jobTitle, count: questions.length })}
          </p>
          <ul className="mt-4 space-y-2 text-start text-sm text-muted-foreground">
            <li>• {t("tip1")}</li>
            <li>• {t("tip2")}</li>
            <li>• {t("tip3")}</li>
          </ul>
          <button
            onClick={handleStart}
            disabled={isPending}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
            {t("startInterview")}
          </button>
        </div>
      </div>
    );
  }

  // Completed/evaluated state
  if (status === "completed" || status === "evaluated") {
    return (
      <div className="mx-auto max-w-2xl text-center">
        <div className="rounded-2xl border border-success/20 bg-success/5 p-8">
          <CheckCircle className="mx-auto h-12 w-12 text-success" />
          <h2 className="mt-4 text-xl font-bold text-foreground">
            {t("interviewComplete")}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {t("interviewCompleteDesc")}
          </p>
        </div>
      </div>
    );
  }

  // In-progress — show questions + recorder
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {t("question")} {currentQuestion + 1} / {questions.length}
          </span>
          <span>
            {completed.length} {t("answered")}
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={questions.length}
          aria-valuenow={completed.length}
          aria-label={t("answered")}
          className="h-2 overflow-hidden rounded-full bg-accent"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all"
            style={{
              width: `${(completed.length / questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="rounded-2xl border border-border bg-card p-6"
        >
          <span className="inline-block rounded-full bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-600 dark:text-violet-400">
            {questions[currentQuestion].category}
          </span>
          <p className="mt-3 text-lg font-medium text-foreground">
            {questions[currentQuestion].text}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Video Recorder */}
      {isUploading ? (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-border bg-card p-12">
          <Upload className="h-6 w-6 animate-bounce text-violet-500" />
          <span className="text-muted-foreground">{t("uploading")}</span>
        </div>
      ) : completed.includes(currentQuestion) ? (
        <div className="rounded-2xl border border-success/20 bg-success/5 p-6 text-center">
          <CheckCircle className="mx-auto h-8 w-8 text-success" />
          <p className="mt-2 text-sm font-medium text-success">
            {t("responseRecorded")}
          </p>
          <div className="mt-3 flex items-center justify-center gap-4">
            <button
              onClick={() =>
                setCompleted((prev) =>
                  prev.filter((i) => i !== currentQuestion)
                )
              }
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              {t("reRecord")}
            </button>
            {currentQuestion < questions.length - 1 && (
              <button
                onClick={() => setCurrentQuestion((p) => p + 1)}
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                {t("nextQuestion")} <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <VideoRecorder onComplete={handleRecordingComplete} />
      )}

      {/* Question navigation */}
      <div className="flex flex-wrap gap-2">
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentQuestion(i)}
            className={`h-8 w-8 rounded-lg text-xs font-medium transition-colors ${
              i === currentQuestion
                ? "bg-primary text-primary-foreground"
                : completed.includes(i)
                  ? "bg-success/20 text-success"
                  : "bg-accent text-muted-foreground"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Complete button */}
      {allAnswered && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={handleComplete}
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <CheckCircle className="h-5 w-5" />
            )}
            {t("completeInterview")}
          </button>
        </motion.div>
      )}
    </div>
  );
}
