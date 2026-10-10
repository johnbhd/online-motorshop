"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getAuthToken } from "@/lib/auth/authStorage";
import {
  getCurrentConversation,
  sendCustomerConversationMessage,
  startConversation,
} from "@/lib/messages/conversationApi";
import {
  getGuestConversationToken,
  setGuestConversationToken,
} from "@/lib/messages/guestTokenStorage";
import type { Conversation } from "@/lib/messages/conversationTypes";
import ChatbotLauncher from "./ChatbotLauncher";
import {
  OPEN_STAFF_CHAT_EVENT,
  type OpenStaffChatDetail,
} from "./chatbotEvents";
import ChatbotPanel, { type ChatbotMode } from "./ChatbotPanel";
import {
  chatbotResponses,
  chatbotQuickActions,
  chatbotWelcomeMessage,
} from "./chatbotData";
import { resolveChatbotResponse } from "./chatbotUtils";
import type {
  ChatMessage,
  ChatQuickAction,
  ChatSender,
  ContactInquiryDraft,
  ProductInquiryDraft,
} from "./chatbotTypes";
import type { ContactInquiryMetadata } from "@/lib/messages/conversationTypes";
import { sendAssistantMessage } from "@/lib/assistant/assistantApi";
import type { AssistantHistoryItem } from "@/lib/assistant/assistantTypes";

const initialMessages: ChatMessage[] = [
  {
    id: "welcome",
    sender: "bot",
    text: chatbotWelcomeMessage,
    createdAt: "",
  },
];

function toChatMessages(conversation: Conversation): ChatMessage[] {
  return conversation.messages.map((message) => {
    return {
      id: String(message.id),
      sender: message.sender,
      text: message.body,
      createdAt: message.created_at,
      messageType: message.message_type,
      metadata: message.metadata,
      attachmentUrl: message.attachment?.url ?? null,
    };
  });
}

function toAssistantHistory(messages: ChatMessage[]): AssistantHistoryItem[] {
  return messages
    .filter((message) => message.id !== "welcome")
    .slice(-10)
    .map((message) => ({
      role: message.sender === "customer" ? "user" : "assistant",
      content: message.text,
    }));
}

function toInquiryMetadata(
  inquiry: ContactInquiryDraft,
): ContactInquiryMetadata {
  return {
    full_name: inquiry.fullName,
    contact_number: inquiry.contactNumber,
    email: inquiry.email,
    inquiry_type: inquiry.inquiryType,
    preferred_branch: inquiry.preferredBranch,
    motorcycle: inquiry.motorcycle,
    product_needed: inquiry.productNeeded,
    order_reference: inquiry.orderReference,
    message: inquiry.message,
  };
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isAssistantThinking, setIsAssistantThinking] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [mode, setMode] = useState<ChatbotMode>("assistant");
  const [staffConversation, setStaffConversation] =
    useState<Conversation | null>(null);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [contactInquiry, setContactInquiry] =
    useState<ContactInquiryDraft | null>(null);
  const [productInquiry, setProductInquiry] =
    useState<ProductInquiryDraft | null>(null);
  const [inquirySending, setInquirySending] = useState(false);
  const { isLoading: isAuthLoading, user } = useAuth();
  const isAuthReady = !isAuthLoading;
  const launcherRef = useRef<HTMLButtonElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const composerInputRef = useRef<HTMLInputElement>(null);
  const messageIdRef = useRef(0);
  const inquirySentCallbackRef = useRef<(() => void) | null>(null);

  const createMessage = useCallback(
    (sender: ChatSender, text: string): ChatMessage => {
      messageIdRef.current += 1;

      return {
        id: sender + "-" + messageIdRef.current,
        sender,
        text,
        createdAt: new Date().toISOString(),
      };
    },
    [],
  );

  const closeChatbot = useCallback(() => {
    setIsOpen(false);

    window.requestAnimationFrame(() => {
      launcherRef.current?.focus();
    });
  }, []);

  const handleSendAssistant = useCallback(
    async (message: string) => {
      if (isAssistantThinking) {
        return false;
      }

      const customerMessage = createMessage("customer", message);

      setMessages((currentMessages) => [...currentMessages, customerMessage]);
      setShowQuickActions(false);

      setIsAssistantThinking(true);

      const localResponse = resolveChatbotResponse(message);

      if (localResponse.text !== chatbotResponses.fallback) {
        setMessages((currentMessages) => [
          ...currentMessages,
          createMessage("bot", localResponse.text),
        ]);
        setIsAssistantThinking(false);
        return true;
      }

      try {
        const response = await sendAssistantMessage({
          message,
          history: toAssistantHistory(messages),
        });

        setMessages((currentMessages) => [
          ...currentMessages,
          createMessage("bot", response),
        ]);
        return true;
      } catch (error) {
        setMessages((currentMessages) => [
          ...currentMessages,
          createMessage(
            "bot",
            error instanceof Error
              ? error.message
              : "I’m having trouble connecting right now. Please try again.",
          ),
        ]);
        return true;
      } finally {
        setIsAssistantThinking(false);
      }
    },
    [createMessage, isAssistantThinking, messages],
  );

  const handleQuickAction = useCallback(
    (action: ChatQuickAction) => {
      void handleSendAssistant(action.query);
    },
    [handleSendAssistant],
  );

  const handleRequestStaff = useCallback(async () => {
    if (!isAuthReady) {
      return;
    }

    setMode("staff");
    setShowQuickActions(false);
    setStaffLoading(true);

    try {
      setStaffConversation(
        await getCurrentConversation(
          getAuthToken(),
          getGuestConversationToken(),
        ),
      );
      setStaffError(null);
    } catch (error) {
      setStaffError(
        error instanceof Error
          ? error.message
          : "Unable to load your staff conversation.",
      );
    } finally {
      setStaffLoading(false);
    }
  }, [isAuthReady]);

  const openStaffChat = useCallback(
    (event: Event) => {
      const detail = (event as CustomEvent<OpenStaffChatDetail>).detail;

      if (detail?.inquiry) {
        setContactInquiry(detail.inquiry);
        setProductInquiry(null);
        inquirySentCallbackRef.current = detail.onSent ?? null;
        setStaffError(null);
      } else if (detail?.productInquiry) {
        setProductInquiry(detail.productInquiry);
        setContactInquiry(null);
        inquirySentCallbackRef.current = null;
        setStaffError(null);
      }

      setMode("staff");
      setShowQuickActions(false);
      setIsOpen(true);

      if (!isAuthReady) {
        return;
      }

      void handleRequestStaff();
    },
    [handleRequestStaff, isAuthReady],
  );

  const handleCancelInquiry = useCallback(() => {
    setContactInquiry(null);
    inquirySentCallbackRef.current = null;
    setStaffError(null);
  }, []);

  const handleCancelProductInquiry = useCallback(() => {
    setProductInquiry(null);
    setStaffError(null);
  }, []);

  const handleConfirmInquiry = useCallback(async () => {
    if (!contactInquiry || inquirySending || !isAuthReady) {
      return;
    }

    setInquirySending(true);
    setStaffLoading(true);
    setStaffError(null);

    try {
      const guestToken = getGuestConversationToken();
      const options = {
        messageType: "contact_inquiry" as const,
        metadata: toInquiryMetadata(contactInquiry),
        attachment: contactInquiry.photo,
      };

      if (staffConversation) {
        setStaffConversation(
          await sendCustomerConversationMessage(
            staffConversation.id,
            "Contact inquiry",
            guestToken,
            options,
          ),
        );
      } else {
        const response = await startConversation(
          "Contact inquiry",
          guestToken,
          options,
        );

        if (response.guest_token) {
          setGuestConversationToken(response.guest_token);
        }

        setStaffConversation(response.conversation);
      }

      setContactInquiry(null);
      const onSent = inquirySentCallbackRef.current;
      inquirySentCallbackRef.current = null;
      onSent?.();
    } catch (error) {
      setStaffError(
        error instanceof Error
          ? error.message
          : "Unable to send your contact inquiry.",
      );
    } finally {
      setInquirySending(false);
      setStaffLoading(false);
    }
  }, [contactInquiry, inquirySending, isAuthReady, staffConversation]);

  useEffect(() => {
    window.addEventListener(OPEN_STAFF_CHAT_EVENT, openStaffChat);

    return () => {
      window.removeEventListener(OPEN_STAFF_CHAT_EVENT, openStaffChat);
    };
  }, [openStaffChat]);

  const handleBackToHelp = useCallback(() => {
    setMode("assistant");
    setShowQuickActions(true);
  }, []);

  const handleStaffSend = useCallback(
    async (message: string) => {
      if (!isAuthReady) {
        return false;
      }

      setStaffLoading(true);

      try {
        const guestToken = getGuestConversationToken();
        const pendingProduct = productInquiry;
        const options = pendingProduct
          ? {
              messageType: "product_inquiry" as const,
              productId: pendingProduct.productId,
            }
          : undefined;

        if (staffConversation) {
          setStaffConversation(
            await sendCustomerConversationMessage(
              staffConversation.id,
              message,
              guestToken,
              options,
            ),
          );
        } else {
          const response = await startConversation(message, guestToken, options);

          if (response.guest_token) {
            setGuestConversationToken(response.guest_token);
          }

          setStaffConversation(response.conversation);
        }

        setStaffError(null);
        if (pendingProduct) {
          setProductInquiry(null);
        }
        return true;
      } catch (error) {
        setStaffError(
          error instanceof Error ? error.message : "Unable to send your message.",
        );
        return false;
      } finally {
        setStaffLoading(false);
      }
    },
    [isAuthReady, productInquiry, staffConversation],
  );

  useEffect(() => {
    const resetTimeout = window.setTimeout(() => {
      setStaffConversation(null);
      setStaffError(null);
      setContactInquiry(null);
      setProductInquiry(null);
      inquirySentCallbackRef.current = null;
    }, 0);

    return () => window.clearTimeout(resetTimeout);
  }, [user?.id]);

  /*
   * The remaining effects and render stay below this point. Keeping the
   * inquiry state in this widget means canceling never creates a message or
   * uploads the selected file.
   */

  useEffect(() => {
    if (!isOpen || mode !== "staff") {
      return;
    }

    const refreshStaffConversation = async () => {
      try {
        setStaffConversation(
          await getCurrentConversation(
            getAuthToken(),
            getGuestConversationToken(),
          ),
        );
      } catch {
        // Keep the current thread visible if a background refresh fails.
      }
    };

    const interval = window.setInterval(() => void refreshStaffConversation(), 10000);
    window.addEventListener("focus", refreshStaffConversation);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshStaffConversation);
    };
  }, [isOpen, mode]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const focusFrame = window.requestAnimationFrame(() => {
      composerInputRef.current?.focus();
    });

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      const openModal = document.querySelector<HTMLElement>(
        '[role="dialog"][aria-modal="true"]',
      );

      if (openModal) {
        return;
      }

      closeChatbot();
    };

    document.addEventListener("keydown", closeOnEscape);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [closeChatbot, isOpen, mode, staffLoading]);

  const visibleMessages =
    mode === "staff" && staffConversation
      ? toChatMessages(staffConversation)
      : mode === "staff"
        ? []
        : messages;

  useEffect(() => {
    if (!isOpen || !messageListRef.current) {
      return;
    }

    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  }, [
    isAssistantThinking,
    isOpen,
    mode,
    messages.length,
    staffConversation?.messages.length,
  ]);

  const handleSend =
    mode === "staff" ? handleStaffSend : handleSendAssistant;

  return (
    <div className="ald-chatbot">
      {isOpen && (
        <ChatbotPanel
          messages={visibleMessages}
          messageListRef={messageListRef}
          composerInputRef={composerInputRef}
          mode={mode}
          quickActions={chatbotQuickActions}
          showQuickActions={showQuickActions}
          onClose={closeChatbot}
          onBackToHelp={handleBackToHelp}
          onQuickAction={handleQuickAction}
          onRequestStaff={handleRequestStaff}
          onToggleQuickActions={() => {
            setShowQuickActions((currentValue) => !currentValue);
          }}
          onSend={handleSend}
          isAssistantThinking={isAssistantThinking}
          staffError={staffError}
          staffLoading={staffLoading}
          contactInquiry={contactInquiry}
          productInquiry={productInquiry}
          inquirySending={inquirySending}
          onCancelInquiry={handleCancelInquiry}
          onConfirmInquiry={() => void handleConfirmInquiry()}
          onCancelProductInquiry={handleCancelProductInquiry}
        />
      )}
      <ChatbotLauncher
        ref={launcherRef}
        isOpen={isOpen}
        onClick={() => {
          if (isOpen) {
            closeChatbot();
            return;
          }

          if (mode === "assistant") {
            setShowQuickActions(true);
          }

          setIsOpen(true);
        }}
      />
    </div>
  );
}
