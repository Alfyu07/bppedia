import type { MockAnswerFeedbackEntry } from "@/lib/mocks";
import type { ChatMessage } from "@/lib/types";

export interface EmployeeJourneySnapshot {
  chatId: string;
  draft: string;
  feedback: Record<string, MockAnswerFeedbackEntry>;
  focus: "composer";
  messages: ChatMessage[];
  pendingTurn: {
    assistantTurnIndex: number;
    attempt: number;
    prompt: string;
    token: string;
  } | null;
  returnHref: string;
  savedAt: number;
  scenario:
    | "success"
    | "loading"
    | "retryable-error"
    | "disconnected"
    | "no-answer";
  scroll: { top: number; atEnd: boolean };
  status: "ready" | "submitted" | "error";
  version: 1;
}

const MAX_AGE_MS = 12 * 60 * 60 * 1000;
const CHAT_ID = /^[\w-]+$/;

export function employeeJourneyKey(chatId: string) {
  return `bppedia:employee-journey:${chatId}`;
}

export function parseEmployeeJourneySnapshot(
  raw: string | null,
  now = Date.now()
): EmployeeJourneySnapshot | null {
  if (!raw) {
    return null;
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value)) {
      return null;
    }
    const { chatId } = value;
    if (
      value.version !== 1 ||
      typeof chatId !== "string" ||
      !CHAT_ID.test(chatId) ||
      value.returnHref !== `/chat/${chatId}` ||
      typeof value.savedAt !== "number" ||
      value.savedAt > now + 60_000 ||
      now - value.savedAt > MAX_AGE_MS ||
      !Array.isArray(value.messages) ||
      !value.messages.every(isChatMessage) ||
      typeof value.draft !== "string" ||
      !isFeedback(value.feedback) ||
      !["ready", "submitted", "error"].includes(String(value.status)) ||
      ![
        "success",
        "loading",
        "retryable-error",
        "disconnected",
        "no-answer",
      ].includes(String(value.scenario)) ||
      !isRecord(value.scroll) ||
      typeof value.scroll.top !== "number" ||
      typeof value.scroll.atEnd !== "boolean" ||
      value.focus !== "composer" ||
      !(value.pendingTurn === null || isPendingTurn(value.pendingTurn))
    ) {
      return null;
    }
    return value as unknown as EmployeeJourneySnapshot;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isChatMessage(value: unknown) {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    (value.role === "user" || value.role === "assistant") &&
    Array.isArray(value.parts)
  );
}

function isFeedback(value: unknown) {
  return (
    isRecord(value) &&
    Object.values(value).every(
      (entry) =>
        isRecord(entry) &&
        (entry.selection === null ||
          entry.selection === "helpful" ||
          entry.selection === "not-helpful") &&
        (entry.status === "saved" || entry.status === "error")
    )
  );
}

function isPendingTurn(value: unknown) {
  return (
    isRecord(value) &&
    typeof value.assistantTurnIndex === "number" &&
    typeof value.attempt === "number" &&
    typeof value.prompt === "string" &&
    typeof value.token === "string"
  );
}
