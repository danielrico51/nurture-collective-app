import { careCoordinator } from "@/content/site";

interface ChatMessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

const ChatMessageBubble = ({
  role,
  content,
  streaming = false,
}: ChatMessageBubbleProps) => {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[min(100%,22rem)] rounded-2xl px-4 py-3.5 text-base leading-relaxed shadow-sm sm:max-w-[80%] sm:py-3 sm:text-sm md:max-w-[75%] ${
          isUser
            ? "rounded-br-md bg-nurture-sage text-white"
            : "rounded-bl-md border border-nurture-sage/15 bg-white text-nurture-charcoal"
        }`}
      >
        <p
          className={`mb-1 text-[10px] font-semibold uppercase tracking-wide ${
            isUser ? "text-right text-white/75" : "text-nurture-sage-dark"
          }`}
        >
          {isUser ? "You" : careCoordinator.intake.messageLabel}
        </p>
        <p className="whitespace-pre-wrap">{content}</p>
        {streaming ? (
          <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-nurture-sage" />
        ) : null}
      </div>
    </div>
  );
};

export default ChatMessageBubble;
