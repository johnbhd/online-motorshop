import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import type {
  ContactInquiryMetadata,
  ProductInquiryMetadata,
} from "@/lib/messages/conversationTypes";

export type ChatSender = "bot" | "customer" | "staff" | "admin";

export type ChatMessage = {
  id: string;
  sender: ChatSender;
  text: string;
  createdAt: string;
  messageType?: "text" | "contact_inquiry" | "product_inquiry";
  metadata?: ContactInquiryMetadata | ProductInquiryMetadata | null;
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

export type ProductInquiryDraft = {
  productId: number;
  name: string;
  partNumber: string;
  price: number;
  image: string;
  brand: string;
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
