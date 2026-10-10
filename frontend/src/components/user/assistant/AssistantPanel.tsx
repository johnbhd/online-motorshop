"use client";

import Image from "next/image";
import type { RefObject } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeadset,
  faPlus,
  faRotateRight,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import AssistantComposer from "./AssistantComposer";
import AssistantSuggestions from "./AssistantSuggestions";
import {
  assistantSuggestions,
  assistantWelcomeMessage,
  assistantWelcomeTitle,
} from "@/lib/assistant/assistantConstants";
import type {
  AssistantMessage,
  AssistantSuggestion,
} from "@/lib/assistant/assistantTypes";

export type AssistantPanelProps = {
  messages: AssistantMessage[];
  messageListRef: RefObject<HTMLDivElement | null>;
  composerRef: RefObject<HTMLTextAreaElement | null>;
  draft: string;
  isSending: boolean;
  error: string | null;
  failedMessageId: string | null;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onRetry: (messageId: string) => void;
  onNewChat: () => void;
  onClose: () => void;
  onTalkToStaff: () => void;
  onSuggestion: (suggestion: AssistantSuggestion) => void;
};

export default function AssistantPanel({
  messages,
  messageListRef,
  composerRef,
  draft,
  isSending,
  error,
  failedMessageId,
  onDraftChange,
  onSend,
  onRetry,
  onNewChat,
  onClose,
  onTalkToStaff,
  onSuggestion,
}: AssistantPanelProps) {
  return (
    <section
      className="ald-assistant__panel"
      id="ald-assistant-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ald-assistant-title"
    >
      <header className="ald-assistant__header">
        <div className="ald-assistant__identity">
          <Image
            className="ald-assistant__header-logo"
            src="/branding/logo.png"
            alt=""
            width={42}
            height={42}
          />
          <div>
            <h2 id="ald-assistant-title">ALD Assistant</h2>
            <p>
              <span className="ald-assistant__status-dot" aria-hidden="true" />
              AI-powered assistant
            </p>
          </div>
        </div>
        <div className="ald-assistant__header-actions">
          <button
            className="ald-assistant__new-chat"
            type="button"
            onClick={onNewChat}
          >
            <FontAwesomeIcon icon={faPlus} aria-hidden="true" />
            <span>New Chat</span>
          </button>
          <button
            className="ald-assistant__close"
            type="button"
            aria-label="Close ALD Assistant"
            onClick={onClose}
          >
            <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div
        ref={messageListRef}
        className="ald-assistant__messages"
        role="log"
        aria-live="polite"
        aria-label="ALD Assistant conversation"
      >
        {messages.length === 0 && (
          <div className="ald-assistant__welcome">
            <div className="ald-assistant__welcome-icon" aria-hidden="true">
              <Image src="/branding/logo.png" alt="" width={34} height={34} />
            </div>
            <h3>{assistantWelcomeTitle}</h3>
            <p>{assistantWelcomeMessage}</p>
            <AssistantSuggestions
              suggestions={assistantSuggestions}
              onSelect={onSuggestion}
            />
          </div>
        )}

        {messages.map((message) => {
          const isUserMessage = message.role === "user";
          const isFailedMessage = failedMessageId === message.id;

          return (
            <div
              className={`ald-assistant__message-row ald-assistant__message-row--${message.role}`}
              key={message.id}
            >
              {!isUserMessage && (
                <Image
                  className="ald-assistant__message-avatar"
                  src="/branding/logo.png"
                  alt=""
                  width={28}
                  height={28}
                />
              )}
              <div
                className={`ald-assistant__message ald-assistant__message--${message.role}`}
              >
                {!isUserMessage && (
                  <span className="ald-assistant__message-label">ALD Assistant</span>
                )}
                <p>{message.content}</p>
                {isFailedMessage && error && (
                  <div className="ald-assistant__retry" role="alert">
                    <span>{error}</span>
                    <button
                      type="button"
                      onClick={() => onRetry(message.id)}
                    >
                      <FontAwesomeIcon icon={faRotateRight} aria-hidden="true" />
                      Retry
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isSending && (
          <div className="ald-assistant__message-row ald-assistant__message-row--assistant">
            <Image
              className="ald-assistant__message-avatar"
              src="/branding/logo.png"
              alt=""
              width={28}
              height={28}
            />
            <div
              className="ald-assistant__message ald-assistant__message--assistant ald-assistant__typing"
              role="status"
              aria-label="ALD Assistant is thinking"
            >
              <span className="ald-assistant__typing-label">Thinking</span>
              <span className="ald-assistant__typing-dot" />
              <span className="ald-assistant__typing-dot" />
              <span className="ald-assistant__typing-dot" />
            </div>
          </div>
        )}
      </div>

      <div className="ald-assistant__support">
        <span>Need help from a person?</span>
        <button type="button" onClick={onTalkToStaff}>
          <FontAwesomeIcon icon={faHeadset} aria-hidden="true" />
          Talk to ALD Staff
        </button>
      </div>

      <AssistantComposer
        inputRef={composerRef}
        value={draft}
        disabled={isSending}
        onChange={onDraftChange}
        onSend={onSend}
      />
    </section>
  );
}
