import type {
  ContactInquiryDraft,
  ProductInquiryDraft,
} from "./chatbotTypes";

export const OPEN_STAFF_CHAT_EVENT = "ald-chatbot-open-staff";

export type OpenStaffChatDetail = {
  conversationId?: number;
  inquiry?: ContactInquiryDraft;
  productInquiry?: ProductInquiryDraft;
  onSent?: () => void;
};
