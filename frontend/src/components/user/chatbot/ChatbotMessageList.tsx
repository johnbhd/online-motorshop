"use client";

import Image from "next/image";
import { forwardRef } from "react";
import type { ChatMessage } from "./chatbotTypes";

export type ChatbotMessageListProps = {
  messages: ChatMessage[];
  ariaLabel?: string;
  isTyping?: boolean;
};

const ChatbotMessageList = forwardRef<
  HTMLDivElement,
  ChatbotMessageListProps
>(function ChatbotMessageList({ messages, ariaLabel, isTyping }, ref) {
  return (
    <div
      ref={ref}
      className="ald-chatbot__messages"
      role="log"
      aria-live="polite"
      aria-label={ariaLabel ?? "ALD conversation"}
    >
      {messages.length === 0 && (
        <p className="ald-chatbot__empty-state">
          You can send a message to ALD Staff here. Responses may not be
          immediate.
        </p>
      )}

      {messages.map((message) => {
        const isBotMessage = message.sender === "bot";
        const isStaffMessage = message.sender === "staff";

        return (
          <div
            className={
              "ald-chatbot__message-row ald-chatbot__message-row--" +
              message.sender
            }
            key={message.id}
          >
            {(isBotMessage || isStaffMessage) && (
              <Image
                className="ald-chatbot__message-avatar"
                src="/branding/logo.png"
                alt={isStaffMessage ? "ALD Staff" : "ALD Motorshop"}
                width={28}
                height={28}
              />
            )}
            <p
              className={
                "ald-chatbot__message ald-chatbot__message--" + message.sender
              }
            >
              {isStaffMessage && (
                <span className="ald-chatbot__message-label">ALD Staff</span>
              )}
              {message.text}
            </p>
          </div>
        );
      })}

      {isTyping && (
        <div className="ald-chatbot__message-row ald-chatbot__message-row--bot">
          <Image
            className="ald-chatbot__message-avatar"
            src="/branding/logo.png"
            alt="ALD Motorshop"
            width={28}
            height={28}
          />
          <div
            className="ald-chatbot__message ald-chatbot__message--bot ald-chatbot__typing"
            role="status"
            aria-label="ALD Assistant is thinking"
          >
            <span className="ald-chatbot__typing-dot" />
            <span className="ald-chatbot__typing-dot" />
            <span className="ald-chatbot__typing-dot" />
          </div>
        </div>
      )}
    </div>
  );
});

export default ChatbotMessageList;
