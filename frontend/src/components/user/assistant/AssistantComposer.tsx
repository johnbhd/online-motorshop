"use client";

import type {
  FormEvent,
  KeyboardEvent,
  RefObject,
} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { ASSISTANT_MAX_MESSAGE_LENGTH } from "@/lib/assistant/assistantConstants";

export type AssistantComposerProps = {
  inputRef: RefObject<HTMLTextAreaElement | null>;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
};

export default function AssistantComposer({
  inputRef,
  value,
  disabled,
  onChange,
  onSend,
}: AssistantComposerProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSend();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      onSend();
    }
  };

  return (
    <form className="ald-assistant__composer" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor="ald-assistant-message-input">
        Message ALD Assistant
      </label>
      <textarea
        ref={inputRef}
        className="ald-assistant__input"
        id="ald-assistant-message-input"
        name="message"
        value={value}
        placeholder="Ask about parts, orders, or delivery..."
        maxLength={ASSISTANT_MAX_MESSAGE_LENGTH}
        rows={2}
        autoComplete="off"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      <div className="ald-assistant__composer-footer">
        <span className="ald-assistant__character-count" aria-live="polite">
          {value.length}/{ASSISTANT_MAX_MESSAGE_LENGTH}
        </span>
        <button
          className="ald-assistant__send"
          type="submit"
          aria-label="Send message to ALD Assistant"
          disabled={!value.trim() || disabled}
        >
          <FontAwesomeIcon icon={faPaperPlane} aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}
