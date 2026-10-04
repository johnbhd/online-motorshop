export type AdminBranchStaff = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
};

export type AdminBranch = {
  id: number;
  name: string;
  address: string;
  contact_number: string;
  pickup_available: boolean;
  status: string;
  staff_count: number;
  active_staff_count: number;
  order_count: number;
  pickup_count: number;
  delivery_count: number;
  created_at: string | null;
  updated_at: string | null;
};

export type AdminBranchDetail = AdminBranch & {
  staff: AdminBranchStaff[];
};

export type AdminBranchPayload = {
  name: string;
  address: string;
  contact_number: string;
  pickup_available: boolean;
  status: "active" | "inactive";
};

export type AdminBranchesResponse = {
  summary: {
    total_branches: number;
    active_branches: number;
    pickup_available_branches: number;
    active_staff: number;
  };
  branches: AdminBranch[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type AdminBranchResponse = {
  branch: AdminBranchDetail;
};

export type AdminBranchMutationResponse = {
  message: string;
  branch: AdminBranchDetail;
};
