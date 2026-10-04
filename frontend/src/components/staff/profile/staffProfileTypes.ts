export type StaffProfileUser = {
  id: number;
  name: string;
  email: string;
  role: "staff";
  status: string;
  created_at: string | null;
};

export type StaffProfileBranch = {
  id: number;
  name: string;
} | null;

export type StaffProfileResponse = {
  user: StaffProfileUser;
  branch: StaffProfileBranch;
};

export type StaffProfileValidationErrors = Record<string, string[]>;
