import type { StaffConversationSummary } from "@/lib/messages/conversationTypes";
import type { StaffOrderSummary } from "@/components/staff/orders/staffOrdersTypes";

export type StaffDashboardBranch = {
  id: number;
  name: string;
};

export type StaffDashboardSummary = {
  active_orders: number;
  pending_orders: number;
  under_review_orders: number;
  confirmed_orders: number;
  completed_orders: number;
  completed_today: number;
  payments_attention: number;
  pickups_attention: number;
  deliveries_attention: number;
  conversations: number;
};

export type StaffDashboardOperational = {
  orders: Record<string, number>;
  payments: Record<string, number>;
  pickups: Record<string, number>;
  deliveries: Record<string, number>;
};

export type StaffDashboardResponse = {
  branch: StaffDashboardBranch | null;
  summary: StaffDashboardSummary;
  recent_orders: StaffOrderSummary[];
  recent_conversations: StaffConversationSummary[];
  operational: StaffDashboardOperational;
};
