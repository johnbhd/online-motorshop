import type { Metadata } from "next";
import ProfilePage from "@/components/user/account/profile/ProfilePage";

export const metadata: Metadata = {
  title: "Profile | ALD Motorshop",
  description: "View your ALD Motorshop customer profile.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function CustomerProfileRoute() {
  return <ProfilePage />;
}
