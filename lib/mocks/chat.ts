import type { AnswerCitation, NoAnswerData } from "@/lib/types";

export const getChatLandingMock = (
  scenario: ChatMockScenario
): ChatLandingMockResult => structuredClone(CHAT_MOCK_FIXTURES[scenario]);

export interface SuggestedQuestion {
  id: string;
  label: string;
  prompt: string;
}

export interface ChatLandingData {
  description: string;
  sourceNotice: string;
  suggestedQuestions: readonly SuggestedQuestion[];
  title: string;
}

interface ChatSuccessResult {
  data: ChatLandingData;
  status: "success";
}

interface ChatLoadingResult {
  status: "loading";
}

interface ChatEmptyResult {
  data: ChatLandingData;
  status: "empty";
}

interface ChatErrorResult {
  error: {
    code: "unavailable";
    message: string;
  };
  status: "error";
}

export type ChatMockScenario = "success" | "loading" | "empty" | "failure";

export type ChatLandingMockResult =
  | ChatSuccessResult
  | ChatLoadingResult
  | ChatEmptyResult
  | ChatErrorResult;

const CHAT_LANDING_COPY = {
  description:
    "BPPedia membantu karyawan menemukan jawaban dari dokumen kebijakan perusahaan.",
  sourceNotice: "Setiap jawaban akan menyertakan sumber yang dapat diperiksa.",
  title: "Tanyakan kebijakan perusahaan",
} as const;

const SUGGESTED_QUESTIONS = [
  {
    id: "annual-leave",
    label: "Bagaimana cara mengajukan cuti tahunan?",
    prompt: "Bagaimana cara mengajukan cuti tahunan?",
  },
  {
    id: "medical-claim",
    label: "Apa ketentuan klaim kesehatan?",
    prompt: "Apa ketentuan klaim kesehatan?",
  },
] as const satisfies readonly SuggestedQuestion[];

const CHAT_MOCK_FIXTURES = {
  empty: {
    data: {
      ...CHAT_LANDING_COPY,
      suggestedQuestions: [],
    },
    status: "empty",
  },
  failure: {
    error: {
      code: "unavailable",
      message: "BPPedia belum dapat memuat saran pertanyaan.",
    },
    status: "error",
  },
  loading: {
    status: "loading",
  },
  success: {
    data: {
      ...CHAT_LANDING_COPY,
      suggestedQuestions: SUGGESTED_QUESTIONS,
    },
    status: "success",
  },
} as const satisfies Record<ChatMockScenario, ChatLandingMockResult>;

export type MockAnswerFeedbackValue = "helpful" | "not-helpful";

export type MockAnswerFeedbackEntry =
  | { selection: MockAnswerFeedbackValue; status: "saved" }
  | { selection: MockAnswerFeedbackValue | null; status: "error" };

export type MockAnswerFeedbackScenario = "success" | "fail-once";

export function getMockAnswerFeedbackScenario(
  value: string | null
): MockAnswerFeedbackScenario {
  return value === "fail-once" ? value : "success";
}

export function getMockAnswerFeedbackOutcome(
  scenario: MockAnswerFeedbackScenario,
  attempt: number
): { status: "success" } | { status: "error" } {
  return scenario === "fail-once" && attempt === 0
    ? { status: "error" }
    : { status: "success" };
}

export function applyMockAnswerFeedback(
  state: Record<string, MockAnswerFeedbackEntry>,
  messageId: string,
  value: MockAnswerFeedbackValue,
  outcome: { status: "success" } | { status: "error" }
): Record<string, MockAnswerFeedbackEntry> {
  return {
    ...state,
    [messageId]:
      outcome.status === "success"
        ? { selection: value, status: "saved" }
        : { selection: null, status: "error" },
  };
}

export type MockConversationLanguage = "id" | "en";

export interface MockConversationReply {
  citations: AnswerCitation[];
  language: MockConversationLanguage;
  text: string;
}

export type MockConversationScenario =
  | "success"
  | "loading"
  | "retryable-error"
  | "disconnected"
  | "no-answer";

export type MockConversationOutcome =
  | { status: "loading" }
  | { message: string; status: "error" }
  | { data: NoAnswerData; status: "no-answer" }
  | { reply: MockConversationReply; status: "success" };

const NO_ANSWER_DATA = {
  message:
    "BPPedia tidak menemukan jawaban yang cukup andal di dokumen yang tersedia. BPPedia tidak akan menebak. Ubah pertanyaan Anda atau periksa dokumen yang mungkin relevan.",
  relevantDocuments: [
    {
      description: "Ringkasan benefit yang tersedia untuk karyawan.",
      href: "/documents/employee-benefits",
      id: "employee-benefits",
      title: "Kebijakan Benefit Karyawan",
    },
    {
      description: "Panduan umum perpindahan dan mobilitas karyawan.",
      href: "/documents/employee-mobility",
      id: "employee-mobility",
      title: "Panduan Mobilitas Karyawan",
    },
  ],
  title: "Jawaban andal tidak ditemukan",
} as const satisfies NoAnswerData;

const ANSWER_CITATIONS = [
  {
    documentId: "employee-benefits",
    href: "/documents/employee-benefits?page=12",
    id: "employee-benefits-v2026-1-p12",
    isActive: true,
    page: 12,
    title: "Kebijakan Benefit Karyawan",
    versionId: "employee-benefits-v2026-1",
    versionLabel: "2026.1",
  },
  {
    documentId: "employee-mobility",
    href: "/documents/employee-mobility?page=8",
    id: "employee-mobility-v2026-1-p8",
    isActive: true,
    page: 8,
    title: "Panduan Mobilitas Karyawan",
    versionId: "employee-mobility-v2026-1",
    versionLabel: "2026.1",
  },
  {
    documentId: "employee-benefits",
    href: "/documents/employee-benefits",
    id: "employee-benefits-archived-p4",
    isActive: false,
    page: 4,
    title: "Arsip Benefit Karyawan",
    versionId: "employee-benefits-archived",
    versionLabel: "2024.1",
  },
] as const satisfies readonly AnswerCitation[];

const MOCK_CONVERSATIONS = {
  en: {
    fallback:
      "You can continue by checking the company policy cited in this conversation.",
    replies: [
      "Submit annual leave through the employee portal, select the dates, and send it to your manager for approval.",
      "Include the leave dates and a short handover note for work that needs coverage.",
      "You can track the approval status from the employee portal.",
    ],
  },
  id: {
    fallback:
      "Anda dapat melanjutkan dengan memeriksa kebijakan perusahaan yang dirujuk dalam percakapan ini.",
    replies: [
      "Ajukan cuti tahunan melalui portal karyawan, pilih tanggal cuti, lalu kirim kepada atasan untuk disetujui.",
      "Cantumkan tanggal cuti dan catatan serah terima singkat untuk pekerjaan yang perlu dilanjutkan.",
      "Status persetujuan dapat dipantau melalui portal karyawan.",
    ],
  },
} as const satisfies Record<
  MockConversationLanguage,
  { fallback: string; replies: readonly string[] }
>;

export function getMockConversationScenario(
  value: string | null
): MockConversationScenario {
  return value === "loading" ||
    value === "retryable-error" ||
    value === "disconnected" ||
    value === "no-answer"
    ? value
    : "success";
}

export function getMockConversationOutcome(
  initialPrompt: string,
  assistantTurnIndex: number,
  scenario: MockConversationScenario,
  attempt: number
): MockConversationOutcome {
  if (scenario === "loading") {
    return { status: "loading" };
  }
  if (scenario === "no-answer" && assistantTurnIndex === 0) {
    return { data: structuredClone(NO_ANSWER_DATA), status: "no-answer" };
  }
  if (attempt === 0 && scenario !== "success" && scenario !== "no-answer") {
    return {
      message:
        scenario === "disconnected"
          ? "Koneksi terputus. Periksa koneksi Anda lalu coba lagi."
          : "Jawaban belum dapat dibuat. Silakan coba lagi.",
      status: "error",
    };
  }
  return {
    reply: getMockConversationReply(initialPrompt, assistantTurnIndex),
    status: "success",
  };
}

export function getMockConversationReply(
  initialPrompt: string,
  assistantTurnIndex: number
): MockConversationReply {
  const language = initialPrompt.trim().toLowerCase().startsWith("how ")
    ? "en"
    : "id";
  const script = MOCK_CONVERSATIONS[language];
  const text =
    script.replies[Math.max(0, assistantTurnIndex)] ?? script.fallback;

  return structuredClone({
    citations: ANSWER_CITATIONS.filter((citation) => citation.isActive),
    language,
    text,
  });
}

interface IdleMockChatHandoff {
  status: "idle";
}

interface SubmittingMockChatHandoff {
  chatId: string;
  prompt: string;
  status: "submitting";
}

interface SucceededMockChatHandoff {
  chatId: string;
  prompt: string;
  status: "succeeded";
}

interface FailedMockChatHandoff {
  chatId: string;
  error: string;
  prompt: string;
  status: "failed";
}

export type MockChatHandoffState =
  | IdleMockChatHandoff
  | SubmittingMockChatHandoff
  | SucceededMockChatHandoff
  | FailedMockChatHandoff;

export function beginMockChatHandoff(
  state: MockChatHandoffState,
  prompt: string,
  createChatId: () => string
): MockChatHandoffState {
  const normalizedPrompt = prompt.trim();

  if (
    !normalizedPrompt ||
    state.status === "submitting" ||
    state.status === "succeeded"
  ) {
    return state;
  }

  return {
    chatId:
      state.status === "failed" && state.prompt === normalizedPrompt
        ? state.chatId
        : createChatId(),
    prompt: normalizedPrompt,
    status: "submitting",
  };
}

export function completeMockChatHandoff(
  state: MockChatHandoffState
): MockChatHandoffState {
  return state.status === "submitting"
    ? { ...state, status: "succeeded" }
    : state;
}

export function failMockChatHandoff(
  state: MockChatHandoffState,
  error: string
): MockChatHandoffState {
  return state.status === "submitting"
    ? { ...state, error, status: "failed" }
    : state;
}

export function changeFailedMockChatPrompt(
  state: MockChatHandoffState,
  prompt: string
): MockChatHandoffState {
  return state.status === "failed" && state.prompt !== prompt.trim()
    ? { status: "idle" }
    : state;
}
