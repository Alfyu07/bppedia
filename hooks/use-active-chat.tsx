"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import useSWR, { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import { useDataStream } from "@/components/chat/data-stream-provider";
import { getChatHistoryPaginationKey } from "@/components/chat/sidebar-history";
import { toast } from "@/components/chat/toast";
import type { VisibilityType } from "@/components/chat/visibility-selector";
import { useAutoResume } from "@/hooks/use-auto-resume";
import { useMockAnswerFeedback } from "@/hooks/use-mock-answer-feedback";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import type { Vote } from "@/lib/db/schema";
import { ChatbotError } from "@/lib/errors";
import {
  beginMockChatHandoff,
  changeFailedMockChatPrompt,
  completeMockChatHandoff,
  failMockChatHandoff,
  getMockAnswerFeedbackScenario,
  getMockConversationOutcome,
  getMockConversationScenario,
  type MockAnswerFeedbackEntry,
  type MockAnswerFeedbackValue,
  type MockChatHandoffState,
  type MockConversationScenario,
} from "@/lib/mocks";
import type { ChatMessage } from "@/lib/types";
import { fetcher, fetchWithErrorHandlers, generateUUID } from "@/lib/utils";

interface PendingMockTurn {
  assistantTurnIndex: number;
  attempt: number;
  prompt: string;
  token: string;
}

type ActiveChatContextValue = {
  chatId: string;
  messages: ChatMessage[];
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  status: UseChatHelpers<ChatMessage>["status"];
  stop: UseChatHelpers<ChatMessage>["stop"];
  regenerate: UseChatHelpers<ChatMessage>["regenerate"];
  addToolApprovalResponse: UseChatHelpers<ChatMessage>["addToolApprovalResponse"];
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  visibilityType: VisibilityType;
  isReadonly: boolean;
  isLoading: boolean;
  isMockChat: boolean;
  mockAnswerFeedback: Record<string, MockAnswerFeedbackEntry>;
  mockChatError: string | undefined;
  mockChatStatus: MockChatHandoffState["status"];
  mockConversationError: string | undefined;
  retryMockMessage: () => void;
  submitMockAnswerFeedback: (
    messageId: string,
    value: MockAnswerFeedbackValue
  ) => void;
  startMockChat: (prompt: string) => void;
  updateMockChatPrompt: (value: string) => void;
  votes: Vote[] | undefined;
  currentModelId: string;
  setCurrentModelId: (id: string) => void;
  showCreditCardAlert: boolean;
  setShowCreditCardAlert: Dispatch<SetStateAction<boolean>>;
};

const ActiveChatContext = createContext<ActiveChatContextValue | null>(null);

function extractChatId(pathname: string): string | null {
  const match = pathname.match(/\/chat\/([^/]+)/);
  return match ? match[1] : null;
}

export function ActiveChatProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setDataStream, setWaitingStatus } = useDataStream();
  const { mutate } = useSWRConfig();
  const [mockHandoff, setMockHandoff] = useState<MockChatHandoffState>({
    status: "idle",
  });
  const mockHandoffRef = useRef(mockHandoff);
  const {
    feedbackByMessageId: mockAnswerFeedback,
    startMockAnswerFeedback,
    submitMockAnswerFeedback,
  } = useMockAnswerFeedback();
  const [mockMessages, setMockMessages] = useState<ChatMessage[]>([]);
  const [mockStatus, setMockStatus] =
    useState<UseChatHelpers<ChatMessage>["status"]>("ready");
  const mockStatusRef = useRef(mockStatus);
  const [mockConversationError, setMockConversationError] = useState<
    string | undefined
  >();
  const [pendingMockTurn, setPendingMockTurn] =
    useState<PendingMockTurn | null>(null);
  const pendingMockTurnRef = useRef<PendingMockTurn | null>(null);
  const handledMockTurnRef = useRef<string | null>(null);
  const mockScenarioRef = useRef<MockConversationScenario>("success");
  const commitMockStatus = useCallback(
    (next: UseChatHelpers<ChatMessage>["status"]) => {
      mockStatusRef.current = next;
      setMockStatus(next);
    },
    []
  );
  const commitPendingMockTurn = useCallback((next: PendingMockTurn | null) => {
    pendingMockTurnRef.current = next;
    setPendingMockTurn(next);
  }, []);
  const commitMockHandoff = useCallback((next: MockChatHandoffState) => {
    mockHandoffRef.current = next;
    setMockHandoff(next);
  }, []);

  const chatIdFromUrl = extractChatId(pathname);
  const mockChatId = mockHandoff.status === "idle" ? null : mockHandoff.chatId;
  const isMockChat =
    mockHandoff.status === "succeeded" && chatIdFromUrl === mockChatId;
  const isNewChat = !chatIdFromUrl;
  const newChatIdRef = useRef(generateUUID());
  const prevPathnameRef = useRef(pathname);

  if (isNewChat && prevPathnameRef.current !== pathname) {
    newChatIdRef.current = generateUUID();
  }
  prevPathnameRef.current = pathname;

  const chatId = chatIdFromUrl ?? newChatIdRef.current;

  const [currentModelId, setCurrentModelId] = useState(DEFAULT_CHAT_MODEL);
  const currentModelIdRef = useRef(currentModelId);
  useEffect(() => {
    currentModelIdRef.current = currentModelId;
  }, [currentModelId]);

  const [input, setInput] = useState("");
  const [showCreditCardAlert, setShowCreditCardAlert] = useState(false);

  const { data: chatData, isLoading } = useSWR(
    isNewChat || isMockChat
      ? null
      : `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/messages?chatId=${chatId}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const initialMessages: ChatMessage[] =
    isNewChat || isMockChat ? [] : (chatData?.messages ?? []);
  const visibility: VisibilityType = isNewChat
    ? "private"
    : (chatData?.visibility ?? "private");

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
    resumeStream,
    addToolApprovalResponse,
  } = useChat<ChatMessage>({
    generateId: generateUUID,
    id: chatId,
    messages: initialMessages,
    onData: (dataPart) => {
      if (dataPart.type === "data-waiting-status") {
        setWaitingStatus(dataPart.data);
        return;
      }
      setDataStream((ds) => (ds ? [...ds, dataPart] : []));
    },
    onError: (error) => {
      if (error.message?.includes("AI Gateway requires a valid credit card")) {
        setShowCreditCardAlert(true);
      } else if (error instanceof ChatbotError) {
        toast({ description: error.message, type: "error" });
      } else {
        toast({
          description: error.message || "Oops, an error occurred!",
          type: "error",
        });
      }
    },
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    },
    sendAutomaticallyWhen: ({ messages: currentMessages }) => {
      const lastMessage = currentMessages.at(-1);
      return (
        lastMessage?.parts?.some(
          (part) =>
            "state" in part &&
            part.state === "approval-responded" &&
            "approval" in part &&
            (part.approval as { approved?: boolean })?.approved === true
        ) ?? false
      );
    },
    transport: new DefaultChatTransport({
      api: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/chat`,
      fetch: fetchWithErrorHandlers,
      prepareSendMessagesRequest(request) {
        const lastMessage = request.messages.at(-1);
        const isToolApprovalContinuation =
          lastMessage?.role !== "user" ||
          request.messages.some((msg) =>
            msg.parts?.some((part) => {
              const { state } = part as { state?: string };
              return (
                state === "approval-responded" || state === "output-denied"
              );
            })
          );

        return {
          body: {
            id: request.id,
            ...(isToolApprovalContinuation
              ? { messages: request.messages }
              : { message: lastMessage }),
            selectedChatModel: currentModelIdRef.current,
            selectedVisibilityType: visibility,
            ...request.body,
          },
        };
      },
    }),
  });

  const startMockChat = useCallback(
    (prompt: string) => {
      const attempt = beginMockChatHandoff(
        mockHandoffRef.current,
        prompt,
        generateUUID
      );

      if (
        attempt === mockHandoffRef.current ||
        attempt.status !== "submitting"
      ) {
        return;
      }

      commitMockHandoff(attempt);
      startMockAnswerFeedback(
        getMockAnswerFeedbackScenario(searchParams.get("mock-feedback"))
      );
      mockScenarioRef.current = getMockConversationScenario(
        searchParams.get("mock-conversation")
      );
      setMockConversationError(undefined);
      setInput("");
      const createdAt = new Date().toISOString();
      setMockMessages([
        {
          id: generateUUID(),
          metadata: { createdAt },
          parts: [{ text: attempt.prompt, type: "text" }],
          role: "user",
        },
      ]);
      commitPendingMockTurn({
        assistantTurnIndex: 0,
        attempt: 0,
        prompt: attempt.prompt,
        token: generateUUID(),
      });
      commitMockStatus("submitted");

      try {
        commitMockHandoff(completeMockChatHandoff(attempt));
        router.push(`/chat/${attempt.chatId}`);
      } catch {
        commitMockHandoff(
          failMockChatHandoff(attempt, "Percakapan belum dapat dibuka.")
        );
        commitMockStatus("ready");
        commitPendingMockTurn(null);
        setMockConversationError(undefined);
        setInput(attempt.prompt);
        setMockMessages([]);
      }
    },
    [
      commitMockHandoff,
      commitMockStatus,
      commitPendingMockTurn,
      router,
      searchParams,
      startMockAnswerFeedback,
    ]
  );

  const updateMockChatPrompt = useCallback(
    (value: string) => {
      setInput(value);
      const next = changeFailedMockChatPrompt(mockHandoffRef.current, value);
      if (next !== mockHandoffRef.current) {
        commitMockHandoff(next);
      }
    },
    [commitMockHandoff]
  );

  const retryMockMessage = useCallback(
    (editedPrompt?: string) => {
      const pending = pendingMockTurnRef.current;
      if (!pending || mockStatusRef.current !== "error") {
        return;
      }

      const prompt = editedPrompt?.trim() || pending.prompt;
      if (prompt !== pending.prompt) {
        setMockMessages((currentMessages) =>
          currentMessages.map((currentMessage, index) =>
            index === currentMessages.length - 1 &&
            currentMessage.role === "user"
              ? {
                  ...currentMessage,
                  parts: [{ text: prompt, type: "text" }],
                }
              : currentMessage
          )
        );
      }
      setMockConversationError(undefined);
      setInput("");
      commitPendingMockTurn({
        ...pending,
        attempt: pending.attempt + 1,
        prompt,
        token: generateUUID(),
      });
      commitMockStatus("submitted");
    },
    [commitMockStatus, commitPendingMockTurn]
  );

  const sendMockMessage = useCallback<
    UseChatHelpers<ChatMessage>["sendMessage"]
  >(
    (message) => {
      const handoff = mockHandoffRef.current;
      if (
        handoff.status !== "succeeded" ||
        mockStatusRef.current === "submitted" ||
        !message
      ) {
        return Promise.resolve();
      }
      const text = message.parts
        ?.filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("")
        .trim();
      if (!text) {
        return Promise.resolve();
      }
      if (mockStatusRef.current === "error") {
        retryMockMessage(text);
        return Promise.resolve();
      }

      const assistantTurnIndex = mockMessages.filter(
        (currentMessage) => currentMessage.role === "assistant"
      ).length;
      const createdAt = new Date().toISOString();
      setMockMessages((currentMessages) => [
        ...currentMessages,
        {
          id: generateUUID(),
          metadata: { createdAt },
          parts: [{ text, type: "text" }],
          role: "user",
        },
      ]);
      setMockConversationError(undefined);
      setInput("");
      commitPendingMockTurn({
        assistantTurnIndex,
        attempt: 0,
        prompt: text,
        token: generateUUID(),
      });
      commitMockStatus("submitted");

      return Promise.resolve();
    },
    [commitMockStatus, commitPendingMockTurn, mockMessages, retryMockMessage]
  );

  useEffect(() => {
    const pending = pendingMockTurn;
    const handoff = mockHandoffRef.current;
    if (
      !pending ||
      handoff.status !== "succeeded" ||
      handledMockTurnRef.current === pending.token
    ) {
      return;
    }

    const outcome = getMockConversationOutcome(
      handoff.prompt,
      pending.assistantTurnIndex,
      mockScenarioRef.current,
      pending.attempt
    );
    if (outcome.status === "loading") {
      return;
    }

    handledMockTurnRef.current = pending.token;
    if (outcome.status === "error") {
      setMockConversationError(outcome.message);
      setInput(pending.prompt);
      commitMockStatus("error");
      return;
    }

    const createdAt = new Date().toISOString();
    setMockMessages((currentMessages) => [
      ...currentMessages,
      {
        id: generateUUID(),
        metadata: { createdAt },
        parts:
          outcome.status === "no-answer"
            ? [{ data: outcome.data, type: "data-noAnswer" }]
            : [
                { text: outcome.reply.text, type: "text" },
                {
                  data: { citations: outcome.reply.citations },
                  type: "data-citations",
                },
              ],
        role: "assistant",
      },
    ]);
    setMockConversationError(undefined);
    commitPendingMockTurn(null);
    commitMockStatus("ready");
  }, [commitMockStatus, commitPendingMockTurn, pendingMockTurn]);

  const previousRouteRef = useRef(pathname);
  useEffect(() => {
    const previousRoute = previousRouteRef.current;
    previousRouteRef.current = pathname;

    if (pathname === "/" && previousRoute !== "/") {
      commitMockHandoff({ status: "idle" });
      startMockAnswerFeedback("success");
      commitMockStatus("ready");
      commitPendingMockTurn(null);
      handledMockTurnRef.current = null;
      setMockConversationError(undefined);
      setMockMessages([]);
      setInput("");
    }
  }, [
    commitMockHandoff,
    commitMockStatus,
    commitPendingMockTurn,
    pathname,
    startMockAnswerFeedback,
  ]);

  useEffect(() => {
    if (status === "submitted" || status === "ready" || status === "error") {
      setWaitingStatus(undefined);
    }
  }, [status, setWaitingStatus]);

  const loadedChatIds = useRef(new Set<string>());

  if (isNewChat && !loadedChatIds.current.has(newChatIdRef.current)) {
    loadedChatIds.current.add(newChatIdRef.current);
  }

  useEffect(() => {
    if (loadedChatIds.current.has(chatId)) {
      return;
    }
    if (chatData?.messages) {
      loadedChatIds.current.add(chatId);
      setMessages(chatData.messages);
    }
  }, [chatId, chatData?.messages, setMessages]);

  const prevChatIdRef = useRef(chatId);
  useEffect(() => {
    if (prevChatIdRef.current !== chatId) {
      prevChatIdRef.current = chatId;
      if (isNewChat) {
        setMessages([]);
      }
    }
  }, [chatId, isNewChat, setMessages]);

  useEffect(() => {
    if (chatData && !isNewChat) {
      const cookieModel = document.cookie
        .split("; ")
        .find((row) => row.startsWith("chat-model="))
        ?.split("=")[1];
      if (cookieModel) {
        setCurrentModelId(decodeURIComponent(cookieModel));
      }
    }
  }, [chatData, isNewChat]);

  useAutoResume({
    autoResume: !isNewChat && !!chatData,
    initialMessages,
    resumeStream,
    setMessages,
  });

  const displayMessages = isMockChat ? mockMessages : messages;
  const displayStatus = isMockChat ? mockStatus : status;
  const isReadonly = isMockChat
    ? true
    : isNewChat
      ? false
      : (chatData?.isReadonly ?? false);

  const { data: votes } = useSWR<Vote[]>(
    !isMockChat && !isReadonly && messages.length >= 2
      ? `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/vote?chatId=${chatId}`
      : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const contextValue = useMemo<ActiveChatContextValue>(
    () => ({
      addToolApprovalResponse,
      chatId,
      currentModelId,
      input,
      isLoading: !isNewChat && isLoading,
      isMockChat,
      isReadonly,
      messages: displayMessages,
      mockAnswerFeedback,
      mockChatError:
        mockHandoff.status === "failed" ? mockHandoff.error : undefined,
      mockChatStatus: mockHandoff.status,
      mockConversationError,
      regenerate,
      retryMockMessage,
      sendMessage: isMockChat ? sendMockMessage : sendMessage,
      setCurrentModelId,
      setInput,
      setMessages,
      setShowCreditCardAlert,
      showCreditCardAlert,
      startMockChat,
      status: displayStatus,
      stop,
      submitMockAnswerFeedback,
      updateMockChatPrompt,
      visibilityType: visibility,
      votes,
    }),
    [
      addToolApprovalResponse,
      chatId,
      currentModelId,
      displayMessages,
      displayStatus,
      input,
      isLoading,
      isMockChat,
      isNewChat,
      isReadonly,
      mockAnswerFeedback,
      mockConversationError,
      mockHandoff,
      regenerate,
      retryMockMessage,
      sendMessage,
      sendMockMessage,
      setMessages,
      showCreditCardAlert,
      startMockChat,
      stop,
      submitMockAnswerFeedback,
      updateMockChatPrompt,
      visibility,
      votes,
    ]
  );

  return (
    <ActiveChatContext.Provider value={contextValue}>
      {children}
    </ActiveChatContext.Provider>
  );
}

export function useActiveChat() {
  const context = useContext(ActiveChatContext);
  if (!context) {
    throw new Error("useActiveChat must be used within ActiveChatProvider");
  }
  return context;
}
