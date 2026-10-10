"use client";

import type { FormEvent, RefObject } from "react";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faPaperPlane,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

export type ChatbotComposerProps = {
  inputRef: RefObject<HTMLInputElement | null>;
  isStaffMode: boolean;
  showQuickActions: boolean;
  isSending?: boolean;
  cooldownSeconds?: number;
  onSend: (message: string) => boolean | Promise<boolean>;
  onToggleQuickActions: () => void;
};

export default function ChatbotComposer({
  inputRef,
  isStaffMode,
  showQuickActions,
  isSending = false,
  cooldownSeconds = 0,
  onSend,
  onToggleQuickActions,
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
    </form>
  );
}
