"use client";

import type { FormEvent, RefObject } from "react";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faBars,
  faPaperPlane,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

export type ChatbotComposerProps = {
  inputRef: RefObject<HTMLInputElement | null>;
  isStaffMode: boolean;
  showQuickActions: boolean;
  isSending?: boolean;
  onSend: (message: string) => void;
  onBackToAssistant: () => void;
  onToggleQuickActions: () => void;
};

export default function ChatbotComposer({
  inputRef,
  isStaffMode,
  showQuickActions,
  isSending = false,
  onSend,
  onBackToAssistant,
  onToggleQuickActions,
}: ChatbotComposerProps) {
  const [message, setMessage] = useState("");
  const hasMessage = message.trim().length > 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedMessage = message.trim();

    if (!normalizedMessage) {
      return;
    }

    onSend(normalizedMessage);
    setMessage("");
    inputRef.current?.focus();
  };

  return (
    <form className="ald-chatbot__composer" onSubmit={handleSubmit}>
      <button
        className="ald-chatbot__composer-menu"
        type="button"
        aria-label={
          isStaffMode
            ? "Back to ALD Assistant"
            : showQuickActions
              ? "Hide chatbot quick actions"
              : "Show chatbot quick actions"
        }
        onClick={isStaffMode ? onBackToAssistant : onToggleQuickActions}
      >
        <FontAwesomeIcon
          icon={isStaffMode ? faArrowLeft : showQuickActions ? faXmark : faBars}
          aria-hidden="true"
        />
      </button>
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
        disabled={isSending}
        onChange={(event) => {
          setMessage(event.target.value);
        }}
      />
      <button
        className="ald-chatbot__send"
        type="submit"
        aria-label="Send message"
        disabled={!hasMessage || isSending}
      >
        <FontAwesomeIcon icon={faPaperPlane} aria-hidden="true" />
      </button>
    </form>
  );
}
