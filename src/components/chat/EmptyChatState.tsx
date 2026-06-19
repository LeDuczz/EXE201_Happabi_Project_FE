import { Bot } from 'lucide-react';
import { AI_CHAT_SUGGESTIONS } from '../../utils/aiChatFormat';

interface EmptyChatStateProps {
  isSending: boolean;
  onSendSuggestion: (message: string) => void;
}

const EmptyChatState = ({ isSending, onSendSuggestion }: EmptyChatStateProps) => (
  <div className="flex h-full flex-col items-center justify-center text-center">
    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[24px] bg-grad text-white shadow-lg">
      <Bot size={30} />
    </div>
    <h2 className="text-heading text-3xl font-semibold text-text-dark">Bạn muốn hỏi gì hôm nay?</h2>
    <p className="mt-2 max-w-lg text-sm font-semibold leading-6 text-text-light">
      AI có thể hỗ trợ trả lời kiến thức chăm sóc mẹ và bé, gợi ý bước tiếp theo, hoặc tra cứu từ kho kiến thức đã duyệt.
    </p>
    <div className="mt-6 grid w-full max-w-2xl grid-cols-2 gap-3">
      {AI_CHAT_SUGGESTIONS.map((item) => (
        <button
          key={item}
          type="button"
          disabled={isSending}
          onClick={() => onSendSuggestion(item)}
          className="rounded-2xl border border-lav-200 bg-white p-4 text-left text-sm font-bold leading-5 text-text-mid shadow-sm transition-all hover:-translate-y-[1px] hover:border-lav-300 hover:bg-[#fff9fb] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {item}
        </button>
      ))}
    </div>
  </div>
);

export default EmptyChatState;
