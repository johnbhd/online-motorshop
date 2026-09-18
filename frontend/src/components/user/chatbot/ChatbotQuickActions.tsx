"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ChatQuickAction } from "./chatbotTypes";

export type ChatbotQuickActionsProps = {
  actions: ChatQuickAction[];
  onSelect: (action: ChatQuickAction) => void;
};

export default function ChatbotQuickActions({
  actions,
  onSelect,
}: ChatbotQuickActionsProps) {
  return (
    <section className="ald-chatbot__quick-actions" aria-label="Chatbot topics">
      <p className="ald-chatbot__quick-actions-title">Choose a topic</p>
      <div className="ald-chatbot__quick-actions-grid">
        {actions.map((action) => (
          <button
            className={`ald-chatbot__quick-action ald-chatbot__quick-action--${action.id}`}
            type="button"
            key={action.id}
            onClick={() => {
              onSelect(action);
            }}
          >
            <FontAwesomeIcon icon={action.icon} aria-hidden="true" />
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
