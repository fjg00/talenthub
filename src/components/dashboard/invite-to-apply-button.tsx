"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Send, Check, Loader2 } from "lucide-react";
import { inviteToApplyAction } from "@/lib/actions/invite";

export function InviteToApplyButton({
  jobId,
  candidateId,
}: {
  jobId: string;
  candidateId: string;
}) {
  const t = useTranslations("jobs");
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  function handleInvite() {
    startTransition(async () => {
      const res = await inviteToApplyAction(jobId, candidateId);
      if (res.success) setSent(true);
    });
  }

  if (sent) {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg bg-success/10 px-3 py-1.5 text-xs font-medium text-success">
        <Check className="h-3.5 w-3.5" />
        {t("invited")}
      </span>
    );
  }

  return (
    <button
      onClick={handleInvite}
      disabled={isPending}
      className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Send className="h-3.5 w-3.5" />
      )}
      {t("inviteToApply")}
    </button>
  );
}
