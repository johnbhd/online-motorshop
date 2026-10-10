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
  onSend: (message: string) => boolean | Promise<boolean>;
  onToggleQuickActions: () => void;
};

export default function ChatbotComposer({
  inputRef,
  isStaffMode,
  showQuickActions,
  isSending = false,
  onSend,
  onToggleQuickActions,
}: ChatbotComposerProps) {
  const [message, setMessage] = useState("");
  const hasMessage = message.trim().length > 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedMessage = message.trim();

    if (!normalizedMessage) {
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
