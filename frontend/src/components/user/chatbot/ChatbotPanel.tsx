"use client";

import Image from "next/image";
import type { RefObject } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeadset, faXmark } from "@fortawesome/free-solid-svg-icons";
import ChatbotComposer from "./ChatbotComposer";
import ChatbotMessageList from "./ChatbotMessageList";
import ChatbotQuickActions from "./ChatbotQuickActions";
import type { ChatMessage, ChatQuickAction } from "./chatbotTypes";

export type ChatbotPanelProps = {
  messages: ChatMessage[];
  messageListRef: RefObject<HTMLDivElement | null>;
  composerInputRef: RefObject<HTMLInputElement | null>;
  quickActions: ChatQuickAction[];
  showQuickActions: boolean;
  staffRequestCreated: boolean;
  onClose: () => void;
  onQuickAction: (action: ChatQuickAction) => void;
  onRequestStaff: () => void;
  onShowQuickActions: () => void;
  onSend: (message: string) => void;
};

export default function ChatbotPanel({
  messages,
  messageListRef,
  composerInputRef,
  quickActions,
  showQuickActions,
  staffRequestCreated,
  onClose,
  onQuickAction,
  onRequestStaff,
  onShowQuickActions,
  onSend,
}: ChatbotPanelProps) {
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
            <h2 id="ald-chatbot-title">ALD Assistant</h2>
            <p>
              <span className="ald-chatbot__status-dot" aria-hidden="true" />
              How can we help?
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
        <ChatbotMessageList ref={messageListRef} messages={messages} />

        {showQuickActions && (
          <ChatbotQuickActions actions={quickActions} onSelect={onQuickAction} />
        )}

        <button
          className="ald-chatbot__staff-action"
          type="button"
          disabled={staffRequestCreated}
          onClick={onRequestStaff}
        >
          <span className="ald-chatbot__staff-action-icon" aria-hidden="true">
            <FontAwesomeIcon icon={faHeadset} />
          </span>
          <span className="ald-chatbot__staff-action-copy">
            <strong>
              {staffRequestCreated
                ? "Staff request recorded"
                : "Talk to ALD Staff"}
            </strong>
            <small>
              {staffRequestCreated
                ? "Saved for this frontend demo"
                : "Request assistance from the team"}
            </small>
          </span>
          <span className="ald-chatbot__staff-action-arrow" aria-hidden="true">
            →
          </span>
        </button>
      </div>

      <ChatbotComposer
        inputRef={composerInputRef}
        onSend={onSend}
        onShowQuickActions={onShowQuickActions}
      />
    </section>
  );
}
