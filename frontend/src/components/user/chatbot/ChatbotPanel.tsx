"use client";

import Image from "next/image";
import type { RefObject } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import ChatbotComposer from "./ChatbotComposer";
import ChatbotMessageList from "./ChatbotMessageList";
import ChatbotQuickActions from "./ChatbotQuickActions";
import type { ChatMessage, ChatQuickAction } from "./chatbotTypes";

export type ChatbotMode = "assistant" | "staff";

export type ChatbotPanelProps = {
  messages: ChatMessage[];
  messageListRef: RefObject<HTMLDivElement | null>;
  composerInputRef: RefObject<HTMLInputElement | null>;
  mode: ChatbotMode;
  quickActions: ChatQuickAction[];
  showQuickActions: boolean;
  onClose: () => void;
  onBackToHelp: () => void;
  onQuickAction: (action: ChatQuickAction) => void;
  onRequestStaff: () => void;
  onToggleQuickActions: () => void;
  onSend: (message: string) => void;
  isAssistantThinking?: boolean;
  staffError?: string | null;
  staffLoading?: boolean;
};

export default function ChatbotPanel({
  messages,
  messageListRef,
  composerInputRef,
  mode,
  quickActions,
  showQuickActions,
  onClose,
  onBackToHelp,
  onQuickAction,
  onRequestStaff,
  onToggleQuickActions,
  onSend,
  isAssistantThinking = false,
  staffError,
  staffLoading = false,
}: ChatbotPanelProps) {
  const isStaffMode = mode === "staff";

  return (
    <section
      className="ald-chatbot__panel"
      id="ald-chatbot-panel"
      role="dialog"
      aria-labelledby="ald-chatbot-title"
    >
      <header className="ald-chatbot__header">
        <div className="ald-chatbot__identity">
          <Image
            className="ald-chatbot__header-logo"
            src="/branding/logo.png"
            alt="ALD Motorshop logo"
            width={42}
            height={42}
          />
          <div>
            <h2 id="ald-chatbot-title">
              {isStaffMode ? "ALD Support" : "ALD Assistant"}
            </h2>
            <p>
              <span className="ald-chatbot__status-dot" aria-hidden="true" />
              {isStaffMode ? "Staff conversation" : "How can we help?"}
            </p>
          </div>
        </div>
        <div className="ald-chatbot__header-actions">
          <button
            className="ald-chatbot__mode-toggle"
            type="button"
            onClick={isStaffMode ? onBackToHelp : onRequestStaff}
          >
            {isStaffMode ? "Back to Help" : "Talk to Staff"}
          </button>
          <button
            className="ald-chatbot__close"
            type="button"
            aria-label="Close chat"
            onClick={onClose}
          >
            <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="ald-chatbot__content">
        <ChatbotMessageList
          ref={messageListRef}
          messages={messages}
          isTyping={isAssistantThinking && !isStaffMode}
          ariaLabel={
            isStaffMode
              ? "Conversation with ALD Staff"
              : "ALD Assistant conversation"
          }
        />

        {isStaffMode && staffLoading && (
          <p className="px-4 py-2 text-xs text-slate-500" role="status">
            Syncing with ALD Staff...
          </p>
        )}
        {isStaffMode && staffError && (
          <p className="px-4 py-2 text-xs text-red-600" role="alert">
            {staffError}
          </p>
        )}

        {!isStaffMode && showQuickActions && (
          <ChatbotQuickActions actions={quickActions} onSelect={onQuickAction} />
        )}
      </div>

      <ChatbotComposer
        inputRef={composerInputRef}
        isStaffMode={isStaffMode}
        showQuickActions={showQuickActions}
        isSending={!isStaffMode && isAssistantThinking}
        onSend={onSend}
        onToggleQuickActions={onToggleQuickActions}
      />
    </section>
  );
}
