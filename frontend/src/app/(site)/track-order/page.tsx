import type { Metadata } from "next";
import TrackOrderPage from "@/components/user/track-order/TrackOrderPage";

export const metadata: Metadata = {
  title: "Track Order | ALD Motorshop",
  description:
    "Review the latest status of an ALD Motorshop order request.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function TrackOrderRoute() {
  return <TrackOrderPage />;
}
