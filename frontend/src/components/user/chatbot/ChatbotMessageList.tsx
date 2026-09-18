"use client";

import Image from "next/image";
import { forwardRef } from "react";
import { ChatMessage } from "./chatbotTypes";

export type ChatbotMessageListProps = {
  messages: ChatMessage[];
};

const ChatbotMessageList = forwardRef<
  HTMLDivElement,
  ChatbotMessageListProps
>(function ChatbotMessageList({ messages }, ref) {
  return (
    <div
      ref={ref}
      className="ald-chatbot__messages"
      role="log"
      aria-live="polite"
      aria-label="ALD Assistant conversation"
    >
      {messages.map((message) => {
        const isBotMessage = message.sender === "bot";

        return (
          <div
            className={`ald-chatbot__message-row ald-chatbot__message-row--${message.sender}`}
            key={message.id}
          >
            {isBotMessage && (
              <Image
                className="ald-chatbot__message-avatar"
                src="/branding/logo.png"
                alt="ALD Motorshop"
                width={28}
                height={28}
              />
            )}
            <p
              className={`ald-chatbot__message ald-chatbot__message--${message.sender}`}
            >
              {message.text}
            </p>
          </div>
        );
      })}
    </div>
  );
});

export default ChatbotMessageList;
