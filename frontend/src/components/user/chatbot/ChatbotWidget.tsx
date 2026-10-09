"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getAuthToken } from "@/lib/auth/authStorage";
import {
  getCurrentConversation,
  sendCustomerConversationMessage,
  startConversation,
} from "@/lib/messages/conversationApi";
import {
  getGuestConversationToken,
  setGuestConversationToken,
} from "@/lib/messages/guestTokenStorage";
import type { Conversation } from "@/lib/messages/conversationTypes";
import ChatbotLauncher from "./ChatbotLauncher";
import { OPEN_STAFF_CHAT_EVENT } from "./chatbotEvents";
import ChatbotPanel, { type ChatbotMode } from "./ChatbotPanel";
import {
  chatbotQuickActions,
  chatbotWelcomeMessage,
} from "./chatbotData";
import { resolveChatbotResponse } from "./chatbotUtils";
import type { ChatMessage, ChatQuickAction, ChatSender } from "./chatbotTypes";

const initialMessages: ChatMessage[] = [
  {
    id: "welcome",
    sender: "bot",
    text: chatbotWelcomeMessage,
    createdAt: "",
  },
];

function toChatMessages(conversation: Conversation): ChatMessage[] {
  return conversation.messages.map((message) => {
    return {
      id: String(message.id),
      sender: message.sender,
      text: message.body,
      createdAt: message.created_at,
    };
  });
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isAssistantThinking, setIsAssistantThinking] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [mode, setMode] = useState<ChatbotMode>("assistant");
  const [staffConversation, setStaffConversation] =
    useState<Conversation | null>(null);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);
  const { isLoading: isAuthLoading, user } = useAuth();
  const isAuthReady = !isAuthLoading;
  const launcherRef = useRef<HTMLButtonElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const composerInputRef = useRef<HTMLInputElement>(null);
  const messageIdRef = useRef(0);
  const assistantResponseTimeoutRef = useRef<number | null>(null);

  const createMessage = useCallback(
    (sender: ChatSender, text: string): ChatMessage => {
      messageIdRef.current += 1;

      return {
        id: sender + "-" + messageIdRef.current,
        sender,
        text,
        createdAt: new Date().toISOString(),
      };
    },
    [],
  );

  const closeChatbot = useCallback(() => {
    setIsOpen(false);

    window.requestAnimationFrame(() => {
      launcherRef.current?.focus();
    });
  }, []);

  const handleSendAssistant = useCallback(
    (message: string) => {
      if (isAssistantThinking) {
        return;
      }

      const customerMessage = createMessage("customer", message);

      setMessages((currentMessages) => [...currentMessages, customerMessage]);
      setShowQuickActions(false);

      setIsAssistantThinking(true);
      assistantResponseTimeoutRef.current = window.setTimeout(() => {
        const botMessage = createMessage(
          "bot",
          resolveChatbotResponse(message).text,
        );

        setMessages((currentMessages) => [...currentMessages, botMessage]);
        setIsAssistantThinking(false);
        assistantResponseTimeoutRef.current = null;
      }, 1000);
    },
    [createMessage, isAssistantThinking],
  );

  const handleQuickAction = useCallback(
    (action: ChatQuickAction) => {
      handleSendAssistant(action.query);
    },
    [handleSendAssistant],
  );

  const handleRequestStaff = useCallback(async () => {
    if (!isAuthReady) {
      return;
    }

    setMode("staff");
    setShowQuickActions(false);
    setStaffLoading(true);

    try {
      setStaffConversation(
        await getCurrentConversation(
          getAuthToken(),
          getGuestConversationToken(),
        ),
      );
      setStaffError(null);
    } catch (error) {
      setStaffError(
        error instanceof Error
          ? error.message
          : "Unable to load your staff conversation.",
      );
    } finally {
      setStaffLoading(false);
    }
  }, [isAuthReady]);

  const openStaffChat = useCallback(() => {
    if (!isAuthReady) {
      return;
    }

    void handleRequestStaff();
    setIsOpen(true);
  }, [handleRequestStaff, isAuthReady]);

  useEffect(() => {
    window.addEventListener(OPEN_STAFF_CHAT_EVENT, openStaffChat);

    return () => {
      window.removeEventListener(OPEN_STAFF_CHAT_EVENT, openStaffChat);
    };
  }, [openStaffChat]);

  const handleBackToHelp = useCallback(() => {
    setMode("assistant");
    setShowQuickActions(true);
  }, []);

  const handleStaffSend = useCallback(
    async (message: string) => {
      setStaffLoading(true);

      try {
        const guestToken = getGuestConversationToken();

        if (staffConversation) {
          setStaffConversation(
            await sendCustomerConversationMessage(
              staffConversation.id,
              message,
              guestToken,
            ),
          );
        } else {
          const response = await startConversation(message, guestToken);

          if (response.guest_token) {
            setGuestConversationToken(response.guest_token);
          }

          setStaffConversation(response.conversation);
        }

        setStaffError(null);
      } catch (error) {
        setStaffError(
          error instanceof Error ? error.message : "Unable to send your message.",
        );
      } finally {
        setStaffLoading(false);
      }
    },
    [staffConversation],
  );

  useEffect(() => {
    return () => {
      if (assistantResponseTimeoutRef.current !== null) {
        window.clearTimeout(assistantResponseTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen || mode !== "staff") {
      return;
    }

    const refreshStaffConversation = async () => {
      try {
        setStaffConversation(
          await getCurrentConversation(
            getAuthToken(),
            getGuestConversationToken(),
          ),
        );
      } catch {
        // Keep the current thread visible if a background refresh fails.
      }
    };

    const interval = window.setInterval(() => void refreshStaffConversation(), 10000);
    window.addEventListener("focus", refreshStaffConversation);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshStaffConversation);
    };
  }, [isOpen, mode]);

  useEffect(() => {
    const resetTimeout = window.setTimeout(() => {
      setStaffConversation(null);
      setStaffError(null);
    }, 0);

    return () => window.clearTimeout(resetTimeout);
  }, [user?.id]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const focusFrame = window.requestAnimationFrame(() => {
      composerInputRef.current?.focus();
    });

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      const openModal = document.querySelector<HTMLElement>(
        '[role="dialog"][aria-modal="true"]',
      );

      if (openModal) {
        return;
      }

      closeChatbot();
    };

    document.addEventListener("keydown", closeOnEscape);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [closeChatbot, isOpen]);

  const visibleMessages =
    mode === "staff" && staffConversation
      ? toChatMessages(staffConversation)
      : mode === "staff"
        ? []
        : messages;

  useEffect(() => {
    if (!isOpen || !messageListRef.current) {
      return;
    }

    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  }, [
    isAssistantThinking,
    isOpen,
    mode,
    messages.length,
    staffConversation?.messages.length,
  ]);

  const handleSend =
    mode === "staff" ? handleStaffSend : handleSendAssistant;

  return (
    <div className="ald-chatbot">
      {isOpen && (
        <ChatbotPanel
          messages={visibleMessages}
          messageListRef={messageListRef}
          composerInputRef={composerInputRef}
          mode={mode}
          quickActions={chatbotQuickActions}
          showQuickActions={showQuickActions}
          onClose={closeChatbot}
          onBackToHelp={handleBackToHelp}
          onQuickAction={handleQuickAction}
          onRequestStaff={handleRequestStaff}
          onToggleQuickActions={() => {
            setShowQuickActions((currentValue) => !currentValue);
          }}
          onSend={handleSend}
          isAssistantThinking={isAssistantThinking}
          staffError={staffError}
          staffLoading={staffLoading}
        />
      )}
      <ChatbotLauncher
        ref={launcherRef}
        isOpen={isOpen}
        onClick={() => {
          if (isOpen) {
            closeChatbot();
            return;
          }

          if (mode === "assistant") {
            setShowQuickActions(true);
          }

          setIsOpen(true);
        }}
      />
    </div>
  );
}
