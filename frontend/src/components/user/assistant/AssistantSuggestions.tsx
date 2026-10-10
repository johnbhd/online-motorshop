import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { AssistantSuggestion } from "@/lib/assistant/assistantTypes";

export type AssistantSuggestionsProps = {
  suggestions: AssistantSuggestion[];
  onSelect: (suggestion: AssistantSuggestion) => void;
};

export default function AssistantSuggestions({
  suggestions,
  onSelect,
}: AssistantSuggestionsProps) {
  return (
    <section className="ald-assistant__suggestions" aria-label="Suggested questions">
      <p className="ald-assistant__suggestions-title">Try asking about</p>
      <div className="ald-assistant__suggestions-grid">
        {suggestions.map((suggestion) => (
          <button
            className="ald-assistant__suggestion"
            type="button"
            key={suggestion.id}
            onClick={() => onSelect(suggestion)}
          >
            <FontAwesomeIcon icon={suggestion.icon} aria-hidden="true" />
            <span>{suggestion.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
