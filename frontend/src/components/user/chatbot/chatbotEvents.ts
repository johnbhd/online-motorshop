import type {
  ContactInquiryDraft,
  ProductInquiryDraft,
} from "./chatbotTypes";

export const OPEN_STAFF_CHAT_EVENT = "ald-chatbot-open-staff";

export type OpenStaffChatDetail = {
  inquiry?: ContactInquiryDraft;
  productInquiry?: ProductInquiryDraft;
  onSent?: () => void;
};
