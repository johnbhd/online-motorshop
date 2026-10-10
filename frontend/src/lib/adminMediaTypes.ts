export const ADMIN_MEDIA_PURPOSES = [
  "product_image",
  "payment_proof",
  "contact_inquiry_attachment",
  "message_attachment",
] as const;

export type AdminMediaPurpose = (typeof ADMIN_MEDIA_PURPOSES)[number];

export const ADMIN_MEDIA_STATUSES = [
  "active",
  "pending",
  "orphaned",
  "canceled",
  "deleted",
  "cleanup_failed",
] as const;

export type AdminMediaStatus = (typeof ADMIN_MEDIA_STATUSES)[number];

export type AdminMediaOption = {
  value: string;
  label: string;
};

export type AdminMediaLinkedRecord = {
  type: string;
  id: number;
  exists: boolean;
  title: string;
  reference?: string | null;
  destination: string | null;
};

export type AdminMediaUser = {
  id: number;
  name: string;
  email: string;
};

export type AdminMediaAsset = {
  id: number;
  cloudinary_public_id: string | null;
  secure_url: string;
  resource_type: string;
  purpose: AdminMediaPurpose | string;
  purpose_label: string;
  status: AdminMediaStatus | string;
  status_label: string;
  original_filename: string | null;
  mime_type: string | null;
  bytes: number | null;
  uploaded_at: string | null;
  deleted_at: string | null;
  cleanup_error: string | null;
  metadata: Record<string, unknown> | null;
  uploaded_by: AdminMediaUser | null;
  deleted_by: AdminMediaUser | null;
  linked_record: AdminMediaLinkedRecord | null;
  can_delete: boolean;
  can_retry_cleanup: boolean;
};

export type AdminMediaResponse = {
  summary: {
    total: number;
    active: number;
    pending: number;
    orphaned: number;
    canceled: number;
    deleted: number;
    cleanup_failed: number;
  };
  types: AdminMediaOption[];
  statuses: AdminMediaOption[];
  media: AdminMediaAsset[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type AdminMediaDetailsResponse = {
  media: AdminMediaAsset;
};

export type AdminMediaMutationResponse = {
  message: string;
  media: AdminMediaAsset;
};
