export type ConversationParticipantType = "customer" | "guest";

export type ConversationMessageSender = "customer" | "staff" | "admin" | "system";

export type ConversationMessageType =
  | "text"
  | "contact_inquiry"
  | "product_inquiry"
  | "order_update";

export type ContactInquiryMetadata = {
  full_name?: string;
  contact_number?: string;
  email?: string;
  inquiry_type?: string;
  preferred_branch?: string;
  motorcycle?: string;
  product_needed?: string;
  order_reference?: string;
  message?: string;
};

export type ProductInquiryMetadata = {
  product_id?: number;
  part_number?: string;
  product_name?: string;
  product_image_url?: string | null;
  product_price?: number | string;
  brand?: string | null;
  category?: string | null;
};

export type OrderUpdateMetadata = {
  event_key?: string;
  source?: string;
  status?: string;
  order_id?: number;
  order_reference?: string;
};

export type ConversationMessageMetadata =
  | ContactInquiryMetadata
  | ProductInquiryMetadata
  | OrderUpdateMetadata;

export type ConversationParticipant = {
  id: number | null;
  name: string;
  email: string | null;
};

export type ConversationMessage = {
  id: number;
  sender: ConversationMessageSender;
  sender_name?: string | null;
  body: string;
  message_type: ConversationMessageType;
  metadata: ConversationMessageMetadata | null;
  read_at: string | null;
  attachment: {
    url: string;
  } | null;
  created_at: string;
};

export type Conversation = {
  id: number;
  participant_type: ConversationParticipantType;
  participant: ConversationParticipant;
  status: "open";
  messages: ConversationMessage[];
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
};

export type StaffConversationSummary = Omit<Conversation, "messages"> & {
  message_count: number;
  last_message: ConversationMessage | null;
};

export type AdminConversationSummary = StaffConversationSummary;
