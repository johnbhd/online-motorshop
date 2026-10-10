import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import type { ContactInquiryMetadata } from "@/lib/messages/conversationTypes";

export type ChatSender = "bot" | "customer" | "staff" | "admin";

export type ChatMessage = {
  id: string;
  sender: ChatSender;
  text: string;
  createdAt: string;
  messageType?: "text" | "contact_inquiry";
  metadata?: ContactInquiryMetadata | null;
  attachmentUrl?: string | null;
};

export type ContactInquiryDraft = {
  fullName: string;
  contactNumber: string;
  email: string;
  inquiryType: string;
  preferredBranch: string;
  motorcycle: string;
  productNeeded: string;
  orderReference: string;
  message: string;
  photo: File | null;
};

export type ChatQuickAction = {
  id: string;
  label: string;
  query: string;
  icon: IconDefinition;
};

export type ChatbotResponse = {
  text: string;
};
