import type { ContactInquiryDraft } from "./chatbotTypes";

export const OPEN_STAFF_CHAT_EVENT = "ald-chatbot-open-staff";

export type OpenStaffChatDetail = {
  inquiry?: ContactInquiryDraft;
  onSent?: () => void;
};
