import type { Metadata } from "next";
import EditableProfilePage from "@/components/user/account/profile/EditableProfilePage";

export const metadata: Metadata = {
  title: "Profile | ALD Motorshop",
  description: "View your ALD Motorshop customer profile.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function CustomerProfileRoute() {
  return <EditableProfilePage />;
}
