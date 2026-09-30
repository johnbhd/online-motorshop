"use client";

import { forwardRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCommentDots, faXmark } from "@fortawesome/free-solid-svg-icons";

export type ChatbotLauncherProps = {
  isOpen: boolean;
  onClick: () => void;
};

const ChatbotLauncher = forwardRef<HTMLButtonElement, ChatbotLauncherProps>(
  function ChatbotLauncher({ isOpen, onClick }, ref) {
    return (
      <button
        ref={ref}
        className="ald-chatbot__launcher"
        type="button"
        aria-label={isOpen ? "Close ALD Assistant" : "Open ALD Assistant"}
        aria-expanded={isOpen}
        aria-controls="ald-chatbot-panel"
        onClick={onClick}
      >
        <FontAwesomeIcon
          icon={isOpen ? faXmark : faCommentDots}
          aria-hidden="true"
        />
      </button>
    );
  },
);

export default ChatbotLauncher;
