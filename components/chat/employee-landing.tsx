"use client";

import { ArrowUpIcon } from "lucide-react";
import { type ChangeEvent, type MouseEvent, useCallback } from "react";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Wordmark } from "@/components/wordmark";
import type { ChatLandingMockResult, MockChatHandoffState } from "@/lib/mocks";

interface EmployeeLandingProps {
  handoffError: string | undefined;
  input: string;
  landing: ChatLandingMockResult;
  mockChatStatus: MockChatHandoffState["status"];
  onInputChange: (value: string) => void;
  onRetry: () => void;
  onSubmit: (prompt: string) => void;
}

export function EmployeeLanding({
  handoffError,
  input,
  landing,
  mockChatStatus,
  onInputChange,
  onRetry,
  onSubmit,
}: EmployeeLandingProps) {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      onInputChange(event.currentTarget.value);
    },
    [onInputChange]
  );
  const handlePromptSubmit = useCallback(
    ({ text }: { text: string }) => onSubmit(text),
    [onSubmit]
  );
  const handleSuggestionClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      onSubmit(event.currentTarget.value);
    },
    [onSubmit]
  );

  if (landing.status === "loading") {
    return <EmployeeLandingLoading />;
  }

  if (landing.status === "error") {
    return (
      <main className="flex min-h-dvh items-center justify-center overflow-x-hidden bg-background px-4">
        <div
          className="w-full max-w-lg rounded-[var(--radius-panel)] border bg-card p-6 shadow-[var(--shadow-card)]"
          role="alert"
        >
          <Wordmark className="min-h-11 items-center" />
          <p className="mt-6 text-sm text-muted-foreground">
            {landing.error.message}
          </p>
          <Button className="mt-4 min-h-11" onClick={onRetry} type="button">
            Coba lagi
          </Button>
        </div>
      </main>
    );
  }

  const isSubmitting = mockChatStatus === "submitting";
  const { data } = landing;

  return (
    <main className="min-h-dvh overflow-x-hidden bg-background px-4 py-6 md:px-8 md:py-10">
      <div className="flex min-h-[calc(100dvh-3rem)] items-center justify-center">
        <section className="w-full max-w-3xl" data-testid="landing-primary">
          <Wordmark className="min-h-11 items-center text-lg" />
          <h1 className="mt-8 max-w-2xl text-balance font-semibold text-4xl tracking-[-0.045em] sm:text-5xl lg:text-6xl">
            {data.title}
          </h1>
          <p className="mt-5 max-w-xl text-pretty text-base text-muted-foreground leading-7 sm:text-lg">
            {data.description}
          </p>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            {data.sourceNotice}
          </p>

          <PromptInput
            className="mt-8 [&>div]:rounded-[var(--radius-panel)] [&>div]:border [&>div]:bg-card [&>div]:shadow-[var(--shadow-composer)] [&>div]:focus-within:shadow-[var(--shadow-composer-focus)]"
            onSubmit={handlePromptSubmit}
          >
            <PromptInputTextarea
              aria-label="Pertanyaan untuk BPPedia"
              className="min-h-28 px-4 pt-4 text-base"
              data-testid="landing-prompt-input"
              disabled={isSubmitting}
              onChange={handleChange}
              placeholder="Tanyakan kebijakan perusahaan"
              value={input}
            />
            <PromptInputFooter className="px-3 pb-3">
              <span className="text-xs text-muted-foreground">
                Enter untuk kirim · Shift+Enter untuk baris baru
              </span>
              <PromptInputSubmit
                aria-label="Kirim pertanyaan"
                className="size-11 rounded-[var(--radius-control)]"
                data-testid="landing-send-button"
                disabled={!input.trim() || isSubmitting}
                status={isSubmitting ? "submitted" : "ready"}
              >
                <ArrowUpIcon className="size-4" />
              </PromptInputSubmit>
            </PromptInputFooter>
          </PromptInput>

          {handoffError ? (
            <div className="mt-4 flex items-center gap-3" role="alert">
              <p className="text-sm text-destructive">{handoffError}</p>
              <Button
                className="min-h-11"
                onClick={onRetry}
                size="sm"
                type="button"
                variant="outline"
              >
                Coba lagi
              </Button>
            </div>
          ) : null}

          {data.suggestedQuestions.length > 0 ? (
            <div
              className="mt-6 grid gap-2 sm:grid-cols-2"
              data-testid="suggested-actions"
            >
              {data.suggestedQuestions.map((question) => (
                <Button
                  className="h-auto min-h-11 justify-start whitespace-normal rounded-[var(--radius-control)] px-4 py-3 text-left"
                  disabled={isSubmitting}
                  key={question.id}
                  onClick={handleSuggestionClick}
                  type="button"
                  value={question.prompt}
                  variant="outline"
                >
                  {question.label}
                </Button>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function EmployeeLandingLoading() {
  return (
    <main
      aria-label="Memuat BPPedia"
      className="min-h-dvh overflow-x-hidden bg-background px-4 py-6 md:px-8 md:py-10"
      role="status"
    >
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-3xl items-center">
        <div className="w-full space-y-5">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-36 w-full" />
        </div>
      </div>
      <span className="sr-only">Memuat BPPedia</span>
    </main>
  );
}
