"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { OPEN_STAFF_CHAT_EVENT } from "@/components/user/chatbot/chatbotEvents";
import {
  assistantTimeoutMessage,
  assistantUnavailableMessage,
  ASSISTANT_REQUEST_TIMEOUT_MS,
} from "@/lib/assistant/assistantConstants";
import { AssistantRequestError, sendAssistantMessage } from "@/lib/assistant/assistantApi";
import {
  clearAssistantHistory,
  getRecentAssistantHistory,
  loadAssistantHistory,
  saveAssistantHistory,
} from "@/lib/assistant/assistantStorage";
import type {
  AssistantMessage,
  AssistantSuggestion,
} from "@/lib/assistant/assistantTypes";
import AssistantLauncher from "./AssistantLauncher";
import AssistantPanel from "./AssistantPanel";

function createMessage(
  role: AssistantMessage["role"],
  content: string,
): AssistantMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

function getRequestErrorMessage(error: unknown) {
  if (error instanceof AssistantRequestError) {
    return error.message;
  }

  if (
    error instanceof Error &&
    (error.name === "AbortError" || error.message === "The operation was aborted")
  ) {
    return assistantTimeoutMessage;
  }

  return assistantUnavailableMessage;
}

export default function AldAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedMessageId, setFailedMessageId] = useState<string | null>(null);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadFrame = window.requestAnimationFrame(() => {
      setMessages(loadAssistantHistory());
      setHasLoadedHistory(true);
    });

    return () => window.cancelAnimationFrame(loadFrame);
  }, []);

  useEffect(() => {
    if (hasLoadedHistory) {
      saveAssistantHistory(messages);
    }
  }, [hasLoadedHistory, messages]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const focusFrame = window.requestAnimationFrame(() => {
      composerRef.current?.focus();
    });

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        window.requestAnimationFrame(() => launcherRef.current?.focus());
      }
    };

    document.addEventListener("keydown", closeOnEscape);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !messageListRef.current) {
      return;
    }

    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  }, [isOpen, isSending, messages.length, error]);

  useEffect(() => {
    if (!isOpen || !window.matchMedia("(max-width: 560px)").matches) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const closeAssistant = useCallback(() => {
    setIsOpen(false);
    window.requestAnimationFrame(() => launcherRef.current?.focus());
  }, []);

  const submitMessage = useCallback(
    async (message: string, retryMessageId?: string) => {
      if (!hasLoadedHistory || isSending) {
        return;
      }

      let normalizedMessage = message.trim();
      let outgoingMessageId = retryMessageId;
      let contextMessages = messages;

      if (retryMessageId) {
        const retryIndex = messages.findIndex(
          (item) => item.id === retryMessageId && item.role === "user",
        );

        if (retryIndex < 0) {
          return;
        }

        normalizedMessage = messages[retryIndex].content;
        contextMessages = messages.slice(0, retryIndex);
      } else {
        if (!normalizedMessage) {
          return;
        }

        const userMessage = createMessage("user", normalizedMessage);
        outgoingMessageId = userMessage.id;
        setMessages((currentMessages) => [...currentMessages, userMessage]);
      }

      setDraft("");
      setError(null);
      setFailedMessageId(null);
      setIsSending(true);

      const controller = new AbortController();
      const timeout = window.setTimeout(
        () => controller.abort(),
        ASSISTANT_REQUEST_TIMEOUT_MS,
      );

      try {
        const response = await sendAssistantMessage({
          message: normalizedMessage,
          history: getRecentAssistantHistory(contextMessages),
          signal: controller.signal,
        });

        setMessages((currentMessages) => [
          ...currentMessages,
          createMessage("assistant", response),
        ]);
      } catch (requestError) {
        setError(getRequestErrorMessage(requestError));
        setFailedMessageId(outgoingMessageId ?? null);
      } finally {
        window.clearTimeout(timeout);
        setIsSending(false);
      }
    },
    [hasLoadedHistory, isSending, messages],
  );

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setDraft("");
    setError(null);
    setFailedMessageId(null);
    clearAssistantHistory();
    window.requestAnimationFrame(() => composerRef.current?.focus());
  }, []);

  const handleTalkToStaff = useCallback(() => {
    closeAssistant();
    window.dispatchEvent(new Event(OPEN_STAFF_CHAT_EVENT));
  }, [closeAssistant]);

  const handleSuggestion = useCallback(
    (suggestion: AssistantSuggestion) => {
      void submitMessage(suggestion.prompt);
    },
    [submitMessage],
  );

  return (
    <div className="ald-assistant">
      {isOpen && (
        <AssistantPanel
          messages={messages}
          messageListRef={messageListRef}
          composerRef={composerRef}
          draft={draft}
          isSending={isSending}
          error={error}
          failedMessageId={failedMessageId}
          onDraftChange={setDraft}
          onSend={() => void submitMessage(draft)}
          onRetry={(messageId) => void submitMessage("", messageId)}
          onNewChat={handleNewChat}
          onClose={closeAssistant}
          onTalkToStaff={handleTalkToStaff}
          onSuggestion={handleSuggestion}
        />
      )}
      <AssistantLauncher
        ref={launcherRef}
        isOpen={isOpen}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
      />
    </div>
  );
}
