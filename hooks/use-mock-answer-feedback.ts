"use client";

import { useCallback, useRef, useState } from "react";
import {
  applyMockAnswerFeedback,
  getMockAnswerFeedbackOutcome,
  type MockAnswerFeedbackEntry,
  type MockAnswerFeedbackScenario,
  type MockAnswerFeedbackValue,
} from "@/lib/mocks";

export function useMockAnswerFeedback() {
  const [feedbackByMessageId, setFeedbackByMessageId] = useState<
    Record<string, MockAnswerFeedbackEntry>
  >({});
  const scenarioRef = useRef<MockAnswerFeedbackScenario>("success");
  const attemptsByMessageIdRef = useRef<Record<string, number>>({});

  const startMockAnswerFeedback = useCallback(
    (scenario: MockAnswerFeedbackScenario) => {
      scenarioRef.current = scenario;
      attemptsByMessageIdRef.current = {};
      setFeedbackByMessageId({});
    },
    []
  );

  const submitMockAnswerFeedback = useCallback(
    (messageId: string, value: MockAnswerFeedbackValue) => {
      const attempt = attemptsByMessageIdRef.current[messageId] ?? 0;
      const outcome = getMockAnswerFeedbackOutcome(
        scenarioRef.current,
        attempt
      );
      attemptsByMessageIdRef.current[messageId] = attempt + 1;
      setFeedbackByMessageId((current) =>
        applyMockAnswerFeedback(current, messageId, value, outcome)
      );
    },
    []
  );

  return {
    feedbackByMessageId,
    startMockAnswerFeedback,
    submitMockAnswerFeedback,
  };
}
