import {
  faCartShopping,
  faLocationDot,
  faStore,
  faTruck,
} from "@fortawesome/free-solid-svg-icons";
import type { ChatQuickAction } from "./chatbotTypes";

export const chatbotWelcomeMessage =
  "Hi! Welcome to ALD Motorshop. How can I help you today?";

export const chatbotQuickActions: ChatQuickAction[] = [
  {
    id: "ordering",
    label: "How do I order?",
    query: "How do I place an order with ALD Motorshop?",
    icon: faCartShopping,
  },
  {
    id: "pickup",
    label: "Store Pickup",
    query: "How does Store Pickup work?",
    icon: faStore,
  },
  {
    id: "delivery",
    label: "Lalamove Delivery",
    query: "How does Lalamove Delivery work?",
    icon: faTruck,
  },
  {
    id: "tracking",
    label: "Track my order",
    query: "How can I track my ALD order?",
    icon: faCartShopping,
  },
  {
    id: "branches",
    label: "Our branches",
    query: "Where are the ALD Motorshop branches?",
    icon: faLocationDot,
  },
];
