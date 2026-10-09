export type AdminPaymentSettings = {
  gcash_account_name: string | null;
  gcash_number: string | null;
  payment_instructions: string | null;
  qr_image_url: string | null;
  is_configured: boolean;
  updated_at: string | null;
};

export type AdminPaymentSettingsResponse = {
  settings: AdminPaymentSettings;
};

export type PublicPaymentInstructions = {
  configured: boolean;
  gcash_account_name: string | null;
  gcash_number: string | null;
  payment_instructions: string | null;
  qr_image_url: string | null;
};

export type PublicPaymentInstructionsResponse = {
  payment_instructions: PublicPaymentInstructions;
};
