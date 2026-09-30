"use client";

import Image from "next/image";
import type { RefObject } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faHeadset,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
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
  onBackToAssistant: () => void;
  onQuickAction: (action: ChatQuickAction) => void;
  onRequestStaff: () => void;
  onToggleQuickActions: () => void;
  onSend: (message: string) => void;
};

export default function ChatbotPanel({
  messages,
  messageListRef,
  composerInputRef,
  mode,
  quickActions,
  showQuickActions,
  onClose,
  onBackToAssistant,
  onQuickAction,
  onRequestStaff,
  onToggleQuickActions,
  onSend,
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
              {isStaffMode ? "ALD Staff" : "ALD Assistant"}
            </h2>
            <p>
              <span className="ald-chatbot__status-dot" aria-hidden="true" />
              {isStaffMode ? "Staff Conversation" : "How can we help?"}
            </p>
          </div>
        </div>
        <button
          className="ald-chatbot__close"
          type="button"
          aria-label="Close chatbot"
          onClick={onClose}
        >
          <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
        </button>
      </header>

      <div className="ald-chatbot__content">
        <ChatbotMessageList
          ref={messageListRef}
          messages={messages}
          ariaLabel={
            isStaffMode
              ? "Conversation with ALD Staff"
              : "ALD Assistant conversation"
          }
        />

        {!isStaffMode && showQuickActions && (
          <ChatbotQuickActions actions={quickActions} onSelect={onQuickAction} />
        )}

        <button
          className="ald-chatbot__staff-action"
          type="button"
          onClick={isStaffMode ? onBackToAssistant : onRequestStaff}
        >
          <span className="ald-chatbot__staff-action-icon" aria-hidden="true">
            <FontAwesomeIcon icon={isStaffMode ? faArrowLeft : faHeadset} />
          </span>
          <span className="ald-chatbot__staff-action-copy">
            <strong>
              {isStaffMode ? "Back to ALD Assistant" : "Talk to ALD Staff"}
            </strong>
            <small>
              {isStaffMode
                ? "Return to the automated assistant"
                : "Request assistance from the team"}
            </small>
          </span>
          <span className="ald-chatbot__staff-action-arrow" aria-hidden="true">
            {isStaffMode ? "←" : "→"}
          </span>
        </button>
      </div>

      <ChatbotComposer
        inputRef={composerInputRef}
        isStaffMode={isStaffMode}
        showQuickActions={showQuickActions}
        onSend={onSend}
        onBackToAssistant={onBackToAssistant}
        onToggleQuickActions={onToggleQuickActions}
      />
    </section>
  );
}
