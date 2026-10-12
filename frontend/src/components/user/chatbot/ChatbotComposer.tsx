"use client";

import type { FormEvent, RefObject } from "react";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faPaperPlane,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { ASSISTANT_MAX_MESSAGE_LENGTH } from "@/lib/assistant/assistantTypes";
import ChatbotReplyPreview from "./ChatbotReplyPreview";
import type { ChatMessage } from "./chatbotTypes";

export type ChatbotComposerProps = {
  inputRef: RefObject<HTMLInputElement | null>;
  isStaffMode: boolean;
  showQuickActions: boolean;
  isSending?: boolean;
  cooldownSeconds?: number;
  onSend: (message: string) => boolean | Promise<boolean>;
  onToggleQuickActions: () => void;
  replyingTo?: ChatMessage | null;
  onCancelReply?: () => void;
};

export default function ChatbotComposer({
  inputRef,
  isStaffMode,
  showQuickActions,
  isSending = false,
  cooldownSeconds = 0,
  onSend,
  onToggleQuickActions,
  replyingTo = null,
  onCancelReply,
}: ChatbotComposerProps) {
  const [message, setMessage] = useState("");
  const hasMessage = message.trim().length > 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedMessage = message.trim();

    if (!normalizedMessage || isSending || cooldownSeconds > 0) {
      return;
    }

    const didSend = await onSend(normalizedMessage);

    if (!didSend) {
      inputRef.current?.focus();
      return;
    }

    setMessage("");
    inputRef.current?.focus();
  };

  return (
    <form className="ald-chatbot__composer" onSubmit={handleSubmit}>
      {!isStaffMode && replyingTo && (
        <div className="ald-chatbot__composer-reply">
          <div className="ald-chatbot__composer-reply-copy">
            <span className="ald-chatbot__composer-reply-label">
              Replying to {replyingTo.sender === "bot" ? "ALD Assistant" : "You"}
            </span>
            <ChatbotReplyPreview
              reference={{
                id: replyingTo.id,
                role: replyingTo.sender === "bot" ? "assistant" : "user",
                content: replyingTo.text,
              }}
            />
          </div>
          <button
            className="ald-chatbot__composer-reply-cancel"
            type="button"
            aria-label="Cancel reply"
            onClick={onCancelReply}
          >
            <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
          </button>
        </div>
      )}
      <div className="ald-chatbot__composer-row">
        {!isStaffMode && (
          <button
            className="ald-chatbot__composer-menu"
            type="button"
            aria-label={
              showQuickActions
                ? "Hide chatbot quick actions"
                : "Show chatbot quick actions"
            }
            disabled={isSending || cooldownSeconds > 0}
            onClick={onToggleQuickActions}
          >
            <FontAwesomeIcon
              icon={showQuickActions ? faXmark : faBars}
              aria-hidden="true"
            />
          </button>
        )}
        <label className="sr-only" htmlFor="ald-chatbot-message-input">
          {isStaffMode ? "Message ALD Staff" : "Message ALD Assistant"}
        </label>
        <input
          ref={inputRef}
          className="ald-chatbot__input"
          id="ald-chatbot-message-input"
          name="message"
          type="text"
          value={message}
          maxLength={ASSISTANT_MAX_MESSAGE_LENGTH}
          placeholder={
            isStaffMode ? "Message ALD Staff..." : "Type your message..."
          }
          autoComplete="off"
          disabled={isStaffMode && isSending}
          onChange={(event) => {
            setMessage(event.target.value);
          }}
        />
        <button
          className="ald-chatbot__send"
          type="submit"
          aria-label="Send message"
          disabled={!hasMessage || isSending || cooldownSeconds > 0}
        >
          <FontAwesomeIcon icon={faPaperPlane} aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}
