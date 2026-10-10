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
        const isAdminMessage = message.sender === "admin";
        const isSupportMessage = isStaffMessage || isAdminMessage;
        const displaySender = isAdminMessage ? "staff" : message.sender;

        return (
          <div
            className={
              "ald-chatbot__message-row ald-chatbot__message-row--" +
              displaySender
            }
            key={message.id}
          >
            {(isBotMessage || isSupportMessage) && (
              <Image
                className="ald-chatbot__message-avatar"
                src="/branding/logo.png"
                alt={isAdminMessage ? "ALD Administrator" : isStaffMessage ? "ALD Staff" : "ALD Motorshop"}
                width={28}
                height={28}
              />
            )}
            <div
              className={
                "ald-chatbot__message ald-chatbot__message--" + displaySender
              }
            >
              {isSupportMessage && (
                <span className="ald-chatbot__message-label">
                  {isAdminMessage ? "ALD Administrator" : "ALD Staff"}
                </span>
              )}
              {message.messageType === "contact_inquiry" && (
                <span className="ald-chatbot__message-type">Contact inquiry</span>
              )}
              <span className="ald-chatbot__message-text">{message.text}</span>
              {message.attachmentUrl && (
                <a
                  className="ald-chatbot__message-attachment"
                  href={message.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={message.attachmentUrl}
                    alt="Contact inquiry attachment"
                  />
                  <span>View attachment</span>
                </a>
              )}
            </div>
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
