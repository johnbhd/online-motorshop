export type AdminProfile = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string | null;
};

export type AdminProfileResponse = {
  user: AdminProfile;
  message?: string;
};

export type AdminProfilePayload = Pick<AdminProfile, "name" | "email">;

export type AdminPasswordPayload = {
  current_password: string;
  password: string;
  password_confirmation: string;
};
