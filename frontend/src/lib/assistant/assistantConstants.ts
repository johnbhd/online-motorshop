import {
  faCartShopping,
  faLocationDot,
  faMotorcycle,
  faTruck,
  faUserPlus,
} from "@fortawesome/free-solid-svg-icons";
import type { AssistantSuggestion } from "./assistantTypes";

export const ASSISTANT_STORAGE_KEY = "ald_assistant_history";
export const ASSISTANT_MAX_MESSAGE_LENGTH = 2000;
export const ASSISTANT_MAX_HISTORY_ITEMS = 10;
export const ASSISTANT_MAX_VISIBLE_MESSAGES = 80;
export const ASSISTANT_REQUEST_TIMEOUT_MS = 35_000;

export const assistantWelcomeTitle = "Hi! I’m the ALD Assistant.";
export const assistantWelcomeMessage =
  "I can help with motorcycle parts, ordering, branches, pickup, delivery, and other ALD questions.";

export const assistantSuggestions: AssistantSuggestion[] = [
  {
    id: "parts",
    label: "Find motorcycle parts",
    prompt: "Can you help me find motorcycle parts?",
    icon: faMotorcycle,
  },
  {
    id: "ordering",
    label: "How does ordering work?",
    prompt: "How does ordering work?",
    icon: faCartShopping,
  },
  {
    id: "delivery",
    label: "Do you deliver?",
    prompt: "Do you deliver?",
    icon: faTruck,
  },
  {
    id: "branches",
    label: "Where are your branches?",
    prompt: "Where are your branches?",
    icon: faLocationDot,
  },
  {
    id: "guest-order",
    label: "Can I order without an account?",
    prompt: "Can I order without an account?",
    icon: faUserPlus,
  },
];

export const assistantUnavailableMessage =
  "I’m having trouble connecting right now. Please try again.";
export const assistantTimeoutMessage =
  "The assistant is taking a little longer than usual. Please try again.";
