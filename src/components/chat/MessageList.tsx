import { Bot, Loader2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { ChatMessage } from '../../types/aiChat';
import EmptyChatState from './EmptyChatState';
import MessageBubble from './MessageBubble';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  isSending: boolean;
  onSendSuggestion: (message: string) => void;
}

const MessageList = ({ messages, isLoading, isSending, onSendSuggestion }: MessageListProps) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isSending]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-lav-dark">
        <Loader2 size={28} className="animate-spin" />
      </div>
    );
  }

  if (messages.length === 0) {
    return <EmptyChatState isSending={isSending} onSendSuggestion={onSendSuggestion} />;
  }

  return (
    <div className="space-y-5">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {isSending && (
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-lav-100 text-lav-dark">
            <Bot size={19} />
          </div>
          <div className="rounded-[22px] border border-lav-100 bg-white px-5 py-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-lav-dark">
              <Loader2 size={16} className="animate-spin" />
              AI đang trả lời...
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
