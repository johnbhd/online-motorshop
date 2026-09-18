"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ChatbotLauncher from "./ChatbotLauncher";
import ChatbotPanel from "./ChatbotPanel";
import {
  chatbotQuickActions,
  chatbotResponses,
  chatbotWelcomeMessage,
} from "./chatbotData";
import {
  resolveChatbotResponse,
  saveStaffAssistanceRequest,
} from "./chatbotUtils";
import type { ChatMessage, ChatQuickAction, ChatSender } from "./chatbotTypes";

const initialMessages: ChatMessage[] = [
  {
    id: "welcome",
    sender: "bot",
    text: chatbotWelcomeMessage,
    createdAt: "",
  },
];

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [staffRequestCreated, setStaffRequestCreated] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const composerInputRef = useRef<HTMLInputElement>(null);
  const messageIdRef = useRef(0);
  const staffRequestCreatedRef = useRef(false);

  const createMessage = useCallback(
    (sender: ChatSender, text: string): ChatMessage => {
      messageIdRef.current += 1;

      return {
        id: `${sender}-${messageIdRef.current}`,
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

  const handleSend = useCallback(
    (message: string, displayText = message) => {
      const customerMessage = createMessage("customer", displayText);
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
      handleSend(action.query, action.label);
    },
    [handleSend],
  );

  const handleRequestStaff = useCallback(() => {
    if (staffRequestCreatedRef.current) {
      return;
    }

    staffRequestCreatedRef.current = true;
    const customerMessage = createMessage("customer", "Talk to ALD Staff");
    const botMessage = createMessage("bot", chatbotResponses.staffAssistance);
    const nextMessages = [...messages, customerMessage, botMessage];

    setMessages(nextMessages);
    setStaffRequestCreated(true);
    setShowQuickActions(false);
    saveStaffAssistanceRequest(nextMessages);
  }, [createMessage, messages]);

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

  useEffect(() => {
    if (!isOpen || !messageListRef.current) {
      return;
    }

    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  }, [isOpen, messages]);

  return (
    <div className="ald-chatbot">
      {isOpen && (
        <ChatbotPanel
          messages={messages}
          messageListRef={messageListRef}
          composerInputRef={composerInputRef}
          quickActions={chatbotQuickActions}
          showQuickActions={showQuickActions}
          staffRequestCreated={staffRequestCreated}
          onClose={closeChatbot}
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
