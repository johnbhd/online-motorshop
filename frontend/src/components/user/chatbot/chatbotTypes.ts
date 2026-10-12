import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import type {
  ContactInquiryMetadata,
  OrderUpdateMetadata,
  ProductInquiryMetadata,
} from "@/lib/messages/conversationTypes";
import type {
  AssistantProductCard,
  AssistantReplyReference,
} from "@/lib/assistant/assistantTypes";

export type ChatSender = "bot" | "customer" | "staff" | "admin" | "system";

export type ChatMessage = {
  id: string;
  sender: ChatSender;
  text: string;
  createdAt: string;
  messageType?: "text" | "contact_inquiry" | "product_inquiry" | "order_update";
  metadata?:
    | ContactInquiryMetadata
    | ProductInquiryMetadata
    | OrderUpdateMetadata
    | null;
  attachmentUrl?: string | null;
  replyTo?: AssistantReplyReference | null;
  products?: AssistantProductCard[];
  totalMatches?: number | null;
  hasMore?: boolean;
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
