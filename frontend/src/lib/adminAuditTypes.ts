export type AdminAuditLog = {
  id: number;
  action: string;
  record_type: string;
  record_id: number;
  record_reference: string | null;
  previous_status: string | null;
  new_status: string | null;
  reason: string;
  actor: { id: number; name: string; role: string } | null;
  created_at: string | null;
};
