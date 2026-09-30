import {
  faCartShopping,
  faLocationDot,
  faStore,
  faTruck,
} from "@fortawesome/free-solid-svg-icons";
import { aboutBranches } from "@/components/user/about/aboutData";
import type { ChatQuickAction } from "./chatbotTypes";

export const chatbotWelcomeMessage =
  "Hi! Welcome to ALD Motorshop. How can I help you today?";

export const chatbotQuickActions: ChatQuickAction[] = [
  {
    id: "ordering",
    label: "How do I order?",
    query: "How do I order?",
    icon: faCartShopping,
  },
  {
    id: "pickup",
    label: "Store Pickup",
    query: "Store Pickup",
    icon: faStore,
  },
  {
    id: "delivery",
    label: "Lalamove Delivery",
    query: "Lalamove Delivery",
    icon: faTruck,
  },
  {
    id: "tracking",
    label: "Track my order",
    query: "Track my order",
    icon: faCartShopping,
  },
  {
    id: "branches",
    label: "Our branches",
    query: "Our branches",
    icon: faLocationDot,
  },
];

export const chatbotResponses = {
  ordering:
    "Browse the available motorcycle parts, open the product you need, add it to your cart, continue to checkout, and submit your order request. ALD staff will review availability and confirm the final amount before fulfillment.",
  pickup:
    "Submit your order request and choose your preferred ALD branch for pickup. ALD staff will confirm product availability and prepare the order before it is marked Ready for Pickup.",
  delivery:
    "Choose Lalamove Delivery during checkout and provide your delivery details. After ALD staff confirms the order and prepares the items, the delivery will be arranged with Lalamove.",
  tracking:
    "You can track your submitted order request using your ALD order reference and verification information.",
  price:
    "Product prices are confirmed by ALD staff. You can submit an order request or contact the team for current pricing.",
  availability:
    "Product availability is subject to confirmation by ALD staff.",
  compatibility:
    "Compatibility information should be confirmed by ALD staff before completing the order request.",
  fallback:
    "I can't confidently answer that inquiry yet. You can choose one of the available topics or talk to ALD staff for assistance.",
} as const;

export const chatbotBranchResponse =
  "ALD Motorshop currently has branches in " + formatBranchNames() + ".";

function formatBranchNames() {
  const branchNames = aboutBranches.map((branch) =>
    branch.name.replace(/\s+Branch$/i, ""),
  );

  if (branchNames.length < 2) {
    return branchNames.join("");
  }

  const lastBranch = branchNames.at(-1);
  const precedingBranches = branchNames.slice(0, -1).join(", ");

  return precedingBranches + ", and " + lastBranch;
}
