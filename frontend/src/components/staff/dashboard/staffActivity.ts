import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faBell,
  faBoxOpen,
  faClipboardList,
  faComments,
  faCreditCard,
  faStar,
  faStore,
  faTruck,
} from "@fortawesome/free-solid-svg-icons";

const activityIcons: Record<string, IconDefinition> = {
  Orders: faClipboardList,
  Payments: faCreditCard,
  Pickup: faStore,
  Messages: faComments,
  Delivery: faTruck,
  Reviews: faStar,
  Product: faBoxOpen,
};

export function getStaffActivityIcon(type: string) {
  return activityIcons[type] ?? faBell;
}

export function getStaffActivityOrderReference(description: string) {
  return description.match(/\bALD-\d{4}-\d{6}\b/)?.[0] ?? null;
}
