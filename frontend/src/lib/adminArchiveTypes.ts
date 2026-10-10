export const ADMIN_ARCHIVE_TYPES = [
  "order",
  "payment",
  "product",
  "customer",
  "branch",
  "staff",
  "category",
  "brand",
] as const;

export type AdminArchiveType = (typeof ADMIN_ARCHIVE_TYPES)[number];

export type AdminArchiveRecordSummary = {
  id: number;
  created_at: string | null;
  reference?: string | null;
  title?: string | null;
  status?: string | null;
  fulfillment_type?: string | null;
  availability_status?: string | null;
  payment_method?: string | null;
  email?: string | null;
  image_url?: string | null;
  order_id?: number | null;
  branch?: string | null;
  relationships?: Record<string, number | boolean>;
};

export type AdminArchiveRecord = {
  id: number;
  archive_id: number;
  archive_type: AdminArchiveType;
  label: string;
  destination: string;
  archived_at: string | null;
  archived_by: number | null;
  record_exists: boolean;
  record: AdminArchiveRecordSummary | null;
};

export type AdminArchiveTypeOption = {
  value: AdminArchiveType;
  label: string;
  destination: string;
};

export type AdminArchiveResponse = {
  archives: AdminArchiveRecord[];
  types: AdminArchiveTypeOption[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type AdminArchiveMutationResponse = {
  message: string;
  archive: {
    id: number;
    archive_type: AdminArchiveType;
    destination: string;
    record?: AdminArchiveRecordSummary | null;
  };
};
