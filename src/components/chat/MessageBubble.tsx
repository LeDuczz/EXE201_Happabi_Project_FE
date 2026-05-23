import { Bot, UserRound } from 'lucide-react';
import type { ChatMessage } from '../../types/aiChat';
import { formatChatDateTime } from '../../utils/aiChatFormat';

interface MessageBubbleProps {
  message: ChatMessage;
}

const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isUser = message.role === 'USER';

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-lav-100 text-lav-dark">
          <Bot size={19} />
        </div>
      )}

      <div className={`max-w-[72%] ${isUser ? 'order-1' : ''}`}>
        <div
          className={`whitespace-pre-wrap rounded-[22px] px-5 py-3 text-[15px] font-semibold leading-7 shadow-sm ${
            isUser
              ? 'bg-grad text-white'
              : 'border border-lav-100 bg-white text-text-dark'
          }`}
        >
          {message.content}
        </div>
        <div className={`mt-1.5 flex items-center gap-2 text-[11px] font-bold text-text-light ${isUser ? 'justify-end' : ''}`}>
          <span>{formatChatDateTime(message.createdAt)}</span>
        </div>
      </div>

      {isUser && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-pink-100 text-pink-dark">
          <UserRound size={19} />
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
