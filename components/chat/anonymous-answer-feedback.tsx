"use client";

import { useCallback } from "react";
import type {
  MockAnswerFeedbackEntry,
  MockAnswerFeedbackValue,
} from "@/lib/mocks";
import { cn } from "@/lib/utils";
import { ThumbDownIcon, ThumbUpIcon } from "./icons";

export function AnonymousAnswerFeedback({
  feedback,
  messageId,
  onFeedback,
}: AnonymousAnswerFeedbackProps) {
  const selection = feedback?.status === "saved" ? feedback.selection : null;
  const status =
    feedback?.status === "saved"
      ? "Terima kasih. Masukan diterima untuk sesi ini."
      : feedback?.status === "error"
        ? "Masukan belum diterima. Coba lagi."
        : "";
  const handleHelpful = useCallback(
    () => onFeedback(messageId, "helpful"),
    [messageId, onFeedback]
  );
  const handleNotHelpful = useCallback(
    () => onFeedback(messageId, "not-helpful"),
    [messageId, onFeedback]
  );

  return (
    <fieldset
      aria-label="Penilaian jawaban"
      className="mt-1 flex flex-wrap items-center gap-2 border-0 p-0"
    >
      <span className="text-muted-foreground text-xs">
        Apakah jawaban ini membantu?
      </span>
      <div className="flex gap-1">
        <FeedbackButton
          icon={<ThumbUpIcon />}
          isSelected={selection === "helpful"}
          label="Ya, jawaban ini membantu"
          onClick={handleHelpful}
        />
        <FeedbackButton
          icon={<ThumbDownIcon />}
          isSelected={selection === "not-helpful"}
          label="Tidak, jawaban ini tidak membantu"
          onClick={handleNotHelpful}
        />
      </div>
      <span
        aria-atomic="true"
        aria-live="polite"
        className={cn(
          "basis-full text-xs",
          feedback?.status === "error"
            ? "font-medium text-red-600 dark:text-red-400"
            : "text-muted-foreground"
        )}
        data-status={feedback?.status ?? "idle"}
        role="status"
      >
        {status}
      </span>
    </fieldset>
  );
}

function FeedbackButton({
  icon,
  isSelected,
  label,
  onClick,
}: FeedbackButtonProps) {
  return (
    <button
      aria-label={label}
      aria-pressed={isSelected}
      className={cn(
        "flex size-11 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isSelected
          ? "border-2 border-primary bg-primary/10 text-primary"
          : "border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
      data-state={isSelected ? "on" : "off"}
      onClick={onClick}
      type="button"
    >
      {icon}
    </button>
  );
}

interface AnonymousAnswerFeedbackProps {
  feedback: MockAnswerFeedbackEntry | undefined;
  messageId: string;
  onFeedback: (messageId: string, value: MockAnswerFeedbackValue) => void;
}

interface FeedbackButtonProps {
  icon: React.ReactNode;
  isSelected: boolean;
  label: string;
  onClick: () => void;
}
