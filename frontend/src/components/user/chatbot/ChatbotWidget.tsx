"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDemoAuth } from "@/components/auth/DemoAuthProvider";
import {
  appendConversationMessage,
  CONVERSATIONS_STORAGE_KEY,
  CONVERSATIONS_UPDATED_EVENT,
  getConversationById,
  getCurrentConversationParticipant,
  getOrCreateConversation,
} from "@/lib/messages/conversationStorage";
import type { DemoConversation } from "@/lib/messages/conversationTypes";
import ChatbotLauncher from "./ChatbotLauncher";
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

function toChatMessages(conversation: DemoConversation): ChatMessage[] {
  return conversation.messages.map((message) => {
    return {
      id: message.id,
      sender: message.sender,
      text: message.text,
      createdAt: message.createdAt,
    };
  });
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [mode, setMode] = useState<ChatbotMode>("assistant");
  const [staffConversation, setStaffConversation] =
    useState<DemoConversation | null>(null);
  const { isReady, session } = useDemoAuth();
  const launcherRef = useRef<HTMLButtonElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const composerInputRef = useRef<HTMLInputElement>(null);
  const messageIdRef = useRef(0);

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
      const customerMessage = createMessage("customer", message);
      const botMessage = createMessage(
        "bot",
        resolveChatbotResponse(message).text,
      );

      setMessages((currentMessages) => [
        ...currentMessages,
        customerMessage,
        botMessage,
      ]);
      setShowQuickActions(false);
    },
    [createMessage],
  );

  const handleQuickAction = useCallback(
    (action: ChatQuickAction) => {
      handleSendAssistant(action.query);
    },
    [handleSendAssistant],
  );

  const handleRequestStaff = useCallback(() => {
    if (!isReady) {
      return;
    }

    const participant = getCurrentConversationParticipant(session);
    const conversation = getOrCreateConversation(participant);

    setStaffConversation(conversation);
    setMode("staff");
    setShowQuickActions(false);
  }, [isReady, session]);

  const handleBackToAssistant = useCallback(() => {
    setMode("assistant");
    setShowQuickActions(true);
  }, []);

  const handleStaffSend = useCallback(
    (message: string) => {
      if (!staffConversation) {
        return;
      }

      const updatedConversation = appendConversationMessage(
        staffConversation.id,
        "customer",
        message,
      );

      if (updatedConversation) {
        setStaffConversation(updatedConversation);
      }
    },
    [staffConversation],
  );

  useEffect(() => {
    const refreshStaffConversation = () => {
      setStaffConversation((currentConversation) => {
        if (!currentConversation) {
          return currentConversation;
        }

        return (
          getConversationById(currentConversation.id) ?? currentConversation
        );
      });
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === CONVERSATIONS_STORAGE_KEY) {
        refreshStaffConversation();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(
      CONVERSATIONS_UPDATED_EVENT,
      refreshStaffConversation,
    );

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(
        CONVERSATIONS_UPDATED_EVENT,
        refreshStaffConversation,
      );
    };
  }, []);

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
  }, [isOpen, mode, messages.length, staffConversation?.messages.length]);

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
          onBackToAssistant={handleBackToAssistant}
          onQuickAction={handleQuickAction}
          onRequestStaff={handleRequestStaff}
          onShowQuickActions={() => {
            setShowQuickActions(true);
          }}
          onSend={handleSend}
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

          setIsOpen(true);
        }}
      />
    </div>
  );
}
