"use client";

import { useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleSaveJobAction } from "@/lib/actions/saved-jobs";

export function SaveJobButton({
  jobId,
  saved: initialSaved,
}: {
  jobId: string;
  saved: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      await toggleSaveJobAction(jobId);
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
      aria-label={initialSaved ? "Unsave job" : "Save job"}
    >
      <Heart
        className={`h-5 w-5 transition-colors ${
          initialSaved
            ? "fill-error text-error"
            : "fill-none"
        }`}
      />
    </button>
  );
}
