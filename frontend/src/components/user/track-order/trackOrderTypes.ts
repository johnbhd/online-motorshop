import type { ProductDisplayItem } from "../products/productsData";

export type TrackOrderProgressState = "complete" | "current" | "pending";

export type TrackOrderProgressStep = {
  label: string;
  state: TrackOrderProgressState;
};

export type TrackOrderProduct = Pick<
  ProductDisplayItem,
  "id" | "partNumber" | "name" | "brand" | "image" | "alt"
>;

export type TrackOrderItem = {
  product: TrackOrderProduct;
  quantity: number;
};

export type TrackOrderActivity = {
  title: string;
  timestamp: string;
  dateTime: string;
  description: string;
  state: "complete" | "current";
};

export type TrackOrderData = {
  reference: string;
  status: string;
  submittedAt: string;
  fulfillmentMethod: string;
  branchName: string;
  paymentStatus: string;
  requestDate: string;
  requestTime: string;
  currentStatus: string;
  currentStatusDescription: string;
  progress: TrackOrderProgressStep[];
  items: TrackOrderItem[];
  activity: TrackOrderActivity[];
  fulfillmentInformation: string;
  paymentInformation: string;
};
