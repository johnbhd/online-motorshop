"use client";

import Image from "next/image";
import Link from "next/link";
import { forwardRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBoxOpen, faReply } from "@fortawesome/free-solid-svg-icons";
import type { ChatMessage } from "./chatbotTypes";
import ChatbotReplyPreview from "./ChatbotReplyPreview";
import ProductInquiryCard from "./ProductInquiryCard";
import AssistantProductCard from "./AssistantProductCard";
import type {
  OrderUpdateMetadata,
  ProductInquiryMetadata,
} from "@/lib/messages/conversationTypes";
import { getDisplayConversationMessageBody } from "@/lib/messages/conversationUtils";

export type ChatbotMessageListProps = {
  messages: ChatMessage[];
  ariaLabel?: string;
  isTyping?: boolean;
  onReply?: (message: ChatMessage) => void;
};

function renderMessageText(text: string) {
  return text.split(/(\*\*[\s\S]+?\*\*)/g).map((part, index) => {
    const boldText = part.match(/^\*\*([\s\S]+)\*\*$/);

    return boldText ? (
      <strong key={`${part}-${index}`}>{boldText[1]}</strong>
    ) : (
      part
    );
  });
}

const ChatbotMessageList = forwardRef<
  HTMLDivElement,
  ChatbotMessageListProps
 >(function ChatbotMessageList({ messages, ariaLabel, isTyping, onReply }, ref) {
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);

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
        const isOrderUpdate =
          message.messageType === "order_update" || message.sender === "system";
        const isSupportMessage =
          (isStaffMessage || isAdminMessage) && !isOrderUpdate;
        const displaySender = isOrderUpdate
          ? "order-update"
          : isAdminMessage
            ? "staff"
            : message.sender;
        const orderUpdateMetadata =
          isOrderUpdate && message.metadata
            ? (message.metadata as OrderUpdateMetadata)
            : null;
        const productMetadata =
          message.messageType === "product_inquiry" && message.metadata
            ? (message.metadata as ProductInquiryMetadata)
            : null;
        const canReply = Boolean(
          onReply && (isBotMessage || message.sender === "customer"),
        );
        const isReplyActionVisible =
          canReply && activeMessageId === message.id;
        const messageRowClassName = [
          "ald-chatbot__message-row",
          "ald-chatbot__message-row--" + displaySender,
          canReply ? "ald-chatbot__message-row--replyable" : "",
          isReplyActionVisible
            ? "ald-chatbot__message-row--actions-visible"
            : "",
        ]
          .filter(Boolean)
          .join(" ");
        const replyAction = canReply ? (
          <button
            className="ald-chatbot__reply-action"
            type="button"
            aria-label={`Reply to ${isBotMessage ? "ALD Assistant" : "your message"}`}
            onClick={(event) => {
              event.stopPropagation();
              setActiveMessageId(null);
              onReply?.(message);
            }}
          >
            <FontAwesomeIcon icon={faReply} aria-hidden="true" />
            <span className="sr-only">Reply</span>
          </button>
        ) : null;

        return (
          <div
            className={messageRowClassName}
            key={message.id}
            onClick={(event) => {
              if (!canReply) {
                return;
              }

              if (
                event.target instanceof HTMLElement &&
                event.target.closest("a, button")
              ) {
                return;
              }

              setActiveMessageId((currentMessageId) =>
                currentMessageId === message.id ? null : message.id,
              );
            }}
          >
            {isOrderUpdate ? (
              <span className="ald-chatbot__order-update-icon" aria-hidden="true">
                <FontAwesomeIcon icon={faBoxOpen} />
              </span>
            ) : (isBotMessage || isSupportMessage) ? (
              <Image
                className="ald-chatbot__message-avatar"
                src="/branding/logo.png"
                alt={isAdminMessage ? "ALD Administrator" : isStaffMessage ? "ALD Staff" : "ALD Motorshop"}
                width={28}
                height={28}
              />
            ) : null}
            {message.sender === "customer" && replyAction}
            <div
              className={
                "ald-chatbot__message ald-chatbot__message--" + displaySender
              }
            >
              {isOrderUpdate ? (
                <span className="ald-chatbot__message-label">
                  Order Update
                  {orderUpdateMetadata?.order_reference
                    ? ` · ${orderUpdateMetadata.order_reference}`
                    : ""}
                </span>
              ) : isSupportMessage ? (
                <span className="ald-chatbot__message-label">
                  {isAdminMessage ? "ALD Administrator" : "ALD Staff"}
                </span>
              ) : null}
              {isOrderUpdate && (
                <span className="ald-chatbot__message-type">Automated update</span>
              )}
              {message.messageType === "contact_inquiry" && (
                <span className="ald-chatbot__message-type">Contact inquiry</span>
              )}
              {message.messageType === "product_inquiry" && (
                <>
                  <span className="ald-chatbot__message-type">Product inquiry</span>
                  {productMetadata && (
                    <ProductInquiryCard
                      product={{
                        name: productMetadata.product_name,
                        partNumber: productMetadata.part_number,
                        price: productMetadata.product_price,
                        image: productMetadata.product_image_url,
                        brand: productMetadata.brand,
                      }}
                    />
                  )}
                </>
              )}
              {message.replyTo && (
                <ChatbotReplyPreview reference={message.replyTo} />
              )}
              <span className="ald-chatbot__message-text">
                {renderMessageText(
                  getDisplayConversationMessageBody(
                    message.messageType ?? "text",
                    message.text,
                  ),
                )}
              </span>
              {isBotMessage && message.products && message.products.length > 0 && (
                <div className="ald-chatbot__assistant-product-results">
                  {message.products.map((product) => (
                    <AssistantProductCard
                      key={product.href}
                      product={product}
                    />
                  ))}
                  {message.hasMore && (
                    <Link
                      className="ald-chatbot__assistant-product-more"
                      href="/products"
                    >
                      View more products
                      <span aria-hidden="true"> →</span>
                    </Link>
                  )}
                </div>
              )}
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
            {isBotMessage && replyAction}
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
