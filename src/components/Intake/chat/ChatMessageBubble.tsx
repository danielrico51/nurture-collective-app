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
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm sm:max-w-[75%] ${
          isUser
            ? "rounded-br-md bg-nurture-sage text-white"
            : "rounded-bl-md border border-nurture-sage/15 bg-white text-nurture-charcoal"
        }`}
      >
        {!isUser ? (
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-nurture-sage-dark">
            Your care coordinator
          </p>
        ) : null}
        <p className="whitespace-pre-wrap">{content}</p>
        {streaming ? (
          <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-nurture-sage" />
        ) : null}
      </div>
    </div>
  );
};

export default ChatMessageBubble;
