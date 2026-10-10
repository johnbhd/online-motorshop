"use client";

import Image from "next/image";
import type { RefObject } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import ChatbotComposer from "./ChatbotComposer";
import ContactInquiryPreview from "./ContactInquiryPreview";
import ChatbotMessageList from "./ChatbotMessageList";
import ChatbotQuickActions from "./ChatbotQuickActions";
import ProductInquiryPreview from "./ProductInquiryPreview";
import type {
  ChatMessage,
  ChatQuickAction,
  ContactInquiryDraft,
  ProductInquiryDraft,
} from "./chatbotTypes";

export type ChatbotMode = "assistant" | "staff";

export type ChatbotPanelProps = {
  messages: ChatMessage[];
  messageListRef: RefObject<HTMLDivElement | null>;
  composerInputRef: RefObject<HTMLInputElement | null>;
  mode: ChatbotMode;
  quickActions: ChatQuickAction[];
  showQuickActions: boolean;
  onClose: () => void;
  onBackToHelp: () => void;
  onQuickAction: (action: ChatQuickAction) => void;
  onRequestStaff: () => void;
  onToggleQuickActions: () => void;
  onSend: (message: string) => boolean | Promise<boolean>;
  isAssistantThinking?: boolean;
  assistantError?: string | null;
  assistantCooldownSeconds?: number;
  staffError?: string | null;
  staffLoading?: boolean;
  contactInquiry?: ContactInquiryDraft | null;
  productInquiry?: ProductInquiryDraft | null;
  inquirySending?: boolean;
  onCancelInquiry: () => void;
  onConfirmInquiry: () => void;
  onCancelProductInquiry: () => void;
};

export default function ChatbotPanel({
  messages,
  messageListRef,
  composerInputRef,
  mode,
  quickActions,
  showQuickActions,
  onClose,
  onBackToHelp,
  onQuickAction,
  onRequestStaff,
  onToggleQuickActions,
  onSend,
  isAssistantThinking = false,
  assistantError,
  assistantCooldownSeconds = 0,
  staffError,
  staffLoading = false,
  contactInquiry,
  productInquiry,
  inquirySending = false,
  onCancelInquiry,
  onConfirmInquiry,
  onCancelProductInquiry,
}: ChatbotPanelProps) {
  const isStaffMode = mode === "staff";
  const contentClassName = [
    "ald-chatbot__content",
    !showQuickActions || isStaffMode
      ? "ald-chatbot__content--topics-hidden"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section
      className="ald-chatbot__panel"
      id="ald-chatbot-panel"
      role="dialog"
      aria-labelledby="ald-chatbot-title"
    >
      <header className="ald-chatbot__header">
        <div className="ald-chatbot__identity">
          <Image
            className="ald-chatbot__header-logo"
            src="/branding/logo.png"
            alt="ALD Motorshop logo"
            width={42}
            height={42}
          />
          <div>
            <h2 id="ald-chatbot-title">
              {isStaffMode ? "ALD Support" : "ALD AI Assistant"}
            </h2>
            <p>
              <span className="ald-chatbot__status-dot" aria-hidden="true" />
              {isStaffMode ? "Staff conversation" : "How can we help?"}
            </p>
          </div>
        </div>
        <div className="ald-chatbot__header-actions">
          <button
            className="ald-chatbot__mode-toggle"
            type="button"
            onClick={isStaffMode ? onBackToHelp : onRequestStaff}
          >
            {isStaffMode ? "Back to Help" : "Talk to Staff"}
          </button>
          <button
            className="ald-chatbot__close"
            type="button"
            aria-label="Close chat"
            onClick={onClose}
          >
            <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className={contentClassName}>
        <ChatbotMessageList
          ref={messageListRef}
          messages={messages}
          isTyping={isAssistantThinking && !isStaffMode}
          ariaLabel={
            isStaffMode
              ? "Conversation with ALD Staff"
              : "ALD Assistant conversation"
          }
        />

        {isStaffMode && staffLoading && (
          <p className="px-4 py-2 text-xs text-slate-500" role="status">
            Syncing with ALD Staff...
          </p>
        )}
        {isStaffMode && staffError && (
          <p className="px-4 py-2 text-xs text-red-600" role="alert">
            {staffError}
          </p>
        )}
        {!isStaffMode && assistantError && (
          <p className="ald-chatbot__assistant-error" role="alert">
            {assistantError}
            {assistantCooldownSeconds > 0 && (
              <span> Try again in {assistantCooldownSeconds}s.</span>
            )}
          </p>
        )}

        {!isStaffMode && showQuickActions && (
          <ChatbotQuickActions
            actions={quickActions}
            disabled={isAssistantThinking || assistantCooldownSeconds > 0}
            onSelect={onQuickAction}
          />
        )}
      </div>

      {isStaffMode && contactInquiry && (
        <ContactInquiryPreview
          inquiry={contactInquiry}
          isSending={inquirySending}
          onCancel={onCancelInquiry}
          onConfirm={onConfirmInquiry}
        />
      )}

      {isStaffMode && productInquiry && !contactInquiry && (
        <ProductInquiryPreview
          product={productInquiry}
          onCancel={onCancelProductInquiry}
        />
      )}

      <ChatbotComposer
        inputRef={composerInputRef}
        isStaffMode={isStaffMode}
        showQuickActions={showQuickActions}
        cooldownSeconds={assistantCooldownSeconds}
        isSending={
          isStaffMode ? staffLoading || inquirySending : isAssistantThinking
        }
        onSend={onSend}
        onToggleQuickActions={onToggleQuickActions}
      />
    </section>
  );
}
