export type AdminStaff = {
  id: number;
  name: string;
  email: string;
  role: "staff" | string;
  status: "active" | "inactive" | string;
  branch: { id: number; name: string } | null;
  orders_handled: number;
  payments_verified: number;
  pickup_requests_handled: number;
  delivery_requests_handled: number;
  messages_sent: number;
  created_at: string | null;
  updated_at: string | null;
};

export type AdminStaffListResponse = {
  summary: {
    total_staff: number;
    active_staff: number;
    inactive_staff: number;
  };
  staff: AdminStaff[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type AdminStaffResponse = {
  staff: AdminStaff;
};

export type AdminStaffMutationResponse = {
  message: string;
  staff: AdminStaff;
};

export type AdminStaffPayload = {
  name: string;
  email: string;
  branch_id?: number;
  status?: "active" | "inactive";
  password?: string;
  password_confirmation?: string;
};
