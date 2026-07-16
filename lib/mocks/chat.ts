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
