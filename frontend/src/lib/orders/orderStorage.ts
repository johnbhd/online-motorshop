import type {
  DemoOrder,
  OrderActivity,
  OrderDeliverySnapshot,
  OrderFulfillment,
  OrderItemSnapshot,
  OrderProductSnapshot,
  OrderStatus,
  PaymentStatus,
} from "./orderTypes";

export const ORDERS_STORAGE_KEY = "ald_orders";

const ORDER_STATUSES: OrderStatus[] = [
  "Pending",
  "Under Review",
  "Confirmed",
  "Waiting for Payment",
  "Payment Verification",
  "Preparing Order",
  "Ready for Pickup",
  "Booked for Delivery",
  "Picked Up by Rider",
  "Completed",
  "Rejected",
  "Cancelled",
];

const PAYMENT_STATUSES: PaymentStatus[] = [
  "Unpaid",
  "Waiting for Payment",
  "Payment Verification",
  "Paid",
];

export function normalizeOrderReference(reference: string): string {
  return reference.trim().toUpperCase();
}

export function normalizeContactNumber(contactNumber: string): string {
  return contactNumber.replace(/[\s\-().]/g, "");
}

export function readDemoOrders(): DemoOrder[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedValue = window.localStorage.getItem(ORDERS_STORAGE_KEY);

    if (!storedValue) {
      return [];
    }

    const parsedValue: unknown = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .map(parseStoredOrder)
      .filter((order): order is DemoOrder => order !== null);
  } catch {
    return [];
  }
}

export function getDemoOrdersForCustomer(customerAccountId: string): DemoOrder[] {
  const normalizedAccountId = customerAccountId.trim();

  if (!normalizedAccountId) {
    return [];
  }

  return readDemoOrders().filter((order) => {
    return order.customerAccountId === normalizedAccountId;
  });
}

export function getDemoOrderByReferenceForCustomer(
  reference: string,
  customerAccountId: string,
): DemoOrder | null {
  const normalizedAccountId = customerAccountId.trim();
  const normalizedReference = normalizeOrderReference(reference);

  if (!normalizedAccountId) {
    return null;
  }

  return (
    readDemoOrders().find((order) => {
      return (
        order.customerAccountId === normalizedAccountId &&
        normalizeOrderReference(order.reference) === normalizedReference
      );
    }) ?? null
  );
}

export function getDemoOrderByReference(reference: string): DemoOrder | null {
  const normalizedReference = normalizeOrderReference(reference);

  return (
    readDemoOrders().find(
      (order) => normalizeOrderReference(order.reference) === normalizedReference,
    ) ?? null
  );
}

export function getDemoOrderByReferenceAndContact(
  reference: string,
  contactNumber: string,
): DemoOrder | null {
  const normalizedReference = normalizeOrderReference(reference);
  const normalizedContactNumber = normalizeContactNumber(contactNumber);

  return (
    readDemoOrders().find((order) => {
      return (
        normalizeOrderReference(order.reference) === normalizedReference &&
        normalizeContactNumber(order.customer.contactNumber) ===
          normalizedContactNumber
      );
    }) ?? null
  );
}

export function saveDemoOrder(order: DemoOrder): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const existingOrders = readDemoOrders();
    const normalizedReference = normalizeOrderReference(order.reference);
    const referenceAlreadyExists = existingOrders.some(
      (existingOrder) =>
        normalizeOrderReference(existingOrder.reference) === normalizedReference,
    );

    if (referenceAlreadyExists) {
      return false;
    }

    window.localStorage.setItem(
      ORDERS_STORAGE_KEY,
      JSON.stringify([...existingOrders, order]),
    );
    return true;
  } catch {
    return false;
  }
}

export function createOrderReference(
  existingOrders: DemoOrder[],
  currentDate = new Date(),
): string {
  const year = currentDate.getFullYear();
  const usedReferences = new Set(
    existingOrders.map((order) => normalizeOrderReference(order.reference)),
  );
  let sequence = existingOrders.reduce((highestSequence, order) => {
    const match = normalizeOrderReference(order.reference).match(
      new RegExp(`^ALD-${year}-(\\d+)$`),
    );

    if (!match) {
      return highestSequence;
    }

    return Math.max(highestSequence, Number(match[1]));
  }, 1000);
  let reference = `ALD-${year}-${String(sequence + 1).padStart(6, "0")}`;

  while (usedReferences.has(reference)) {
    sequence += 1;
    reference = `ALD-${year}-${String(sequence + 1).padStart(6, "0")}`;
  }

  return reference;
}

export function updateDemoOrderStatus(
  reference: string,
  status: OrderStatus,
  activity: Omit<OrderActivity, "id" | "status" | "createdAt">,
  currentDate = new Date(),
): DemoOrder | null {
  if (typeof window === "undefined") {
    return null;
  }

  const existingOrders = readDemoOrders();
  const normalizedReference = normalizeOrderReference(reference);
  const orderIndex = existingOrders.findIndex(
    (order) => normalizeOrderReference(order.reference) === normalizedReference,
  );

  if (orderIndex === -1) {
    return null;
  }

  const timestamp = currentDate.toISOString();
  const updatedOrder: DemoOrder = {
    ...existingOrders[orderIndex],
    status,
    updatedAt: timestamp,
    activities: [
      ...existingOrders[orderIndex].activities,
      {
        id: `${timestamp}-${status}`,
        status,
        title: activity.title,
        message: activity.message,
        createdAt: timestamp,
      },
    ],
  };
  const nextOrders = [...existingOrders];
  nextOrders[orderIndex] = updatedOrder;

  try {
    window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(nextOrders));
    return updatedOrder;
  } catch {
    return null;
  }
}

function parseStoredOrder(value: unknown): DemoOrder | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<DemoOrder>;
  const items = parseOrderItems(candidate.items);
  const customer = parseCustomer(candidate.customer);
  const fulfillment = parseFulfillment(candidate.fulfillment);
  const status = parseOrderStatus(candidate.status);
  const paymentStatus = parsePaymentStatus(candidate.paymentStatus);

  if (
    typeof candidate.reference !== "string" ||
    !customer ||
    !fulfillment ||
    !status ||
    !paymentStatus ||
    !items.length ||
    typeof candidate.createdAt !== "string"
  ) {
    return null;
  }

  // Legacy orders without ownership remain explicitly unowned.
  const customerAccountId =
    typeof candidate.customerAccountId === "string" &&
    candidate.customerAccountId.trim()
      ? candidate.customerAccountId.trim()
      : null;

  const finalAmount =
    typeof candidate.finalAmount === "number" &&
    Number.isFinite(candidate.finalAmount) &&
    candidate.finalAmount > 0
      ? candidate.finalAmount
      : null;

  const activities = parseActivities(candidate.activities);
  const totalQuantity =
    typeof candidate.totalQuantity === "number" &&
    Number.isFinite(candidate.totalQuantity)
      ? candidate.totalQuantity
      : items.reduce((total, item) => total + item.quantity, 0);
  const estimatedSubtotal =
    typeof candidate.estimatedSubtotal === "number" &&
    Number.isFinite(candidate.estimatedSubtotal)
      ? candidate.estimatedSubtotal
      : null;

  return {
    reference: normalizeOrderReference(candidate.reference),
    customerAccountId,
    customer,
    items,
    fulfillment,
    orderNotes:
      typeof candidate.orderNotes === "string" ? candidate.orderNotes : "",
    estimatedSubtotal,
    finalAmount,
    totalQuantity,
    status,
    paymentStatus,
    createdAt: candidate.createdAt,
    updatedAt:
      typeof candidate.updatedAt === "string"
        ? candidate.updatedAt
        : candidate.createdAt,
    activities,
  };
}

function parseCustomer(value: unknown): DemoOrder["customer"] | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<DemoOrder["customer"]>;

  if (
    typeof candidate.fullName !== "string" ||
    typeof candidate.email !== "string" ||
    typeof candidate.contactNumber !== "string"
  ) {
    return null;
  }

  return {
    fullName: candidate.fullName,
    email: candidate.email,
    contactNumber: candidate.contactNumber,
  };
}

function parseOrderItems(value: unknown): OrderItemSnapshot[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isOrderItemSnapshot);
}

function isOrderItemSnapshot(value: unknown): value is OrderItemSnapshot {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<OrderItemSnapshot>;
  const product = parseProductSnapshot(candidate.product);

  return Boolean(
    product &&
      typeof candidate.compatibility === "string" &&
      typeof candidate.price === "number" &&
      Number.isFinite(candidate.price) &&
      typeof candidate.quantity === "number" &&
      Number.isFinite(candidate.quantity) &&
      candidate.quantity >= 1,
  );
}

function parseProductSnapshot(value: unknown): OrderProductSnapshot | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<OrderProductSnapshot>;

  if (
    typeof candidate.id !== "string" ||
    typeof candidate.partNumber !== "string" ||
    typeof candidate.name !== "string" ||
    typeof candidate.brand !== "string" ||
    typeof candidate.image !== "string" ||
    typeof candidate.alt !== "string"
  ) {
    return null;
  }

  return {
    id: candidate.id,
    partNumber: candidate.partNumber,
    name: candidate.name,
    brand: candidate.brand,
    image: candidate.image,
    alt: candidate.alt,
  };
}

function parseFulfillment(value: unknown): OrderFulfillment | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<OrderFulfillment>;

  if (candidate.method === "pickup") {
    const branch = candidate.branch;

    if (
      !branch ||
      typeof branch.id !== "string" ||
      typeof branch.name !== "string" ||
      typeof branch.address !== "string"
    ) {
      return null;
    }

    return {
      method: "pickup",
      branch: {
        id: branch.id,
        name: branch.name,
        address: branch.address,
      },
    };
  }

  if (candidate.method === "delivery") {
    const delivery = parseDelivery(candidate.delivery);

    if (!delivery) {
      return null;
    }

    return {
      method: "delivery",
      delivery,
    };
  }

  return null;
}

function parseDelivery(value: unknown): OrderDeliverySnapshot | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<OrderDeliverySnapshot>;

  if (
    typeof candidate.address !== "string" ||
    typeof candidate.barangay !== "string" ||
    typeof candidate.city !== "string" ||
    typeof candidate.contactPerson !== "string" ||
    typeof candidate.notes !== "string"
  ) {
    return null;
  }

  return {
    address: candidate.address,
    barangay: candidate.barangay,
    city: candidate.city,
    contactPerson: candidate.contactPerson,
    notes: candidate.notes,
  };
}

function parseActivities(value: unknown): OrderActivity[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isOrderActivity);
}

function isOrderActivity(value: unknown): value is OrderActivity {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<OrderActivity>;

  return Boolean(
    typeof candidate.id === "string" &&
      parseOrderStatus(candidate.status) &&
      typeof candidate.title === "string" &&
      typeof candidate.message === "string" &&
      typeof candidate.createdAt === "string",
  );
}

function parseOrderStatus(value: unknown): OrderStatus | null {
  return typeof value === "string" && ORDER_STATUSES.includes(value as OrderStatus)
    ? (value as OrderStatus)
    : null;
}

function parsePaymentStatus(value: unknown): PaymentStatus | null {
  return typeof value === "string" &&
    PAYMENT_STATUSES.includes(value as PaymentStatus)
    ? (value as PaymentStatus)
    : null;
}
