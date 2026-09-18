import { aboutBranches } from "../about/aboutData";
import { productCatalog } from "../products/productsData";
import type {
  TrackOrderData,
  TrackOrderProduct,
} from "./trackOrderTypes";

const findDemoProduct = (productId: string): TrackOrderProduct => {
  const product = productCatalog.find((candidate) => candidate.id === productId);

  if (!product) {
    throw new Error(`Track order fixture references missing product: ${productId}`);
  }

  return {
    id: product.id,
    partNumber: product.partNumber,
    name: product.name,
    brand: product.brand,
    image: product.image,
    alt: product.alt,
  };
};

const manilaBranch = aboutBranches.find(
  (branch) => branch.name === "Manila Branch",
);

if (!manilaBranch) {
  throw new Error("Track order fixture references missing Manila Branch.");
}

/*
 * UI-only display data for the first Track Order page pass. This is not a
 * lookup result and must be replaced by an agreed backend contract later.
 */
export const demoTrackOrder: TrackOrderData = {
  reference: "ALD-2026-001024",
  status: "Preparing Order",
  submittedAt: "September 18, 2026 · 3:40 PM",
  fulfillmentMethod: "Store Pickup",
  branchName: manilaBranch.name,
  paymentStatus: "Waiting for Payment",
  requestDate: "September 18, 2026",
  requestTime: "3:40 PM",
  currentStatus: "Preparing Order",
  currentStatusDescription:
    "Your order request has been confirmed and the ALD team is preparing the items for fulfillment.",
  progress: [
    { label: "Order Request Submitted", state: "complete" },
    { label: "Under Review", state: "complete" },
    { label: "Confirmed", state: "complete" },
    { label: "Preparing Order", state: "current" },
    { label: "Ready for Pickup / Delivery", state: "pending" },
    { label: "Completed", state: "pending" },
  ],
  items: [
    { product: findDemoProduct("HON-003"), quantity: 1 },
    { product: findDemoProduct("HON-007"), quantity: 1 },
    { product: findDemoProduct("YAM-009"), quantity: 2 },
  ],
  activity: [
    {
      title: "Preparing Order",
      timestamp: "September 18, 2026 · 5:42 PM",
      dateTime: "2026-09-18T17:42:00+08:00",
      description: "Your requested items are being prepared for fulfillment.",
      state: "current",
    },
    {
      title: "Order Confirmed",
      timestamp: "September 18, 2026 · 4:28 PM",
      dateTime: "2026-09-18T16:28:00+08:00",
      description: "The order request was confirmed by ALD staff.",
      state: "complete",
    },
    {
      title: "Under Review",
      timestamp: "September 18, 2026 · 3:55 PM",
      dateTime: "2026-09-18T15:55:00+08:00",
      description: "ALD staff reviewed the request and item availability.",
      state: "complete",
    },
    {
      title: "Order Request Submitted",
      timestamp: "September 18, 2026 · 3:40 PM",
      dateTime: "2026-09-18T15:40:00+08:00",
      description: "Your order request was received by ALD Motorshop.",
      state: "complete",
    },
  ],
  fulfillmentInformation:
    "Once your order is prepared, the status will change to Ready for Pickup. Please wait for confirmation before visiting the branch.",
  paymentInformation:
    "Payment instructions will follow after ALD staff confirms the order request and final amount.",
};
