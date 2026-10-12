import type { AssistantReplyReference } from "@/lib/assistant/assistantTypes";

export type ChatbotReplyPreviewProps = {
  reference: AssistantReplyReference;
  className?: string;
};

export default function ChatbotReplyPreview({
  reference,
  className = "",
}: ChatbotReplyPreviewProps) {
  const label = reference.role === "assistant" ? "ALD Assistant" : "You";

  return (
    <div
      className={`ald-chatbot__reply-reference ${className}`.trim()}
      aria-label={`Replying to ${label}`}
    >
      <span className="ald-chatbot__reply-reference-label">{label}</span>
      <span className="ald-chatbot__reply-reference-text">
        {reference.content}
      </span>
    </div>
  );
}
