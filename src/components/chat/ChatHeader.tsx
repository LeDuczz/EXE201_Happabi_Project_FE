import { RefreshCcw, Sparkles } from 'lucide-react';
import Btn from '../common/Btn';
import type { Conversation } from '../../types/aiChat';

interface ChatHeaderProps {
  activeConversation: Conversation | null;
  onRefresh: () => void;
}

const ChatHeader = ({ activeConversation, onRefresh }: ChatHeaderProps) => (
  <div className="flex items-center justify-between gap-4 border-b border-lav-200 px-6 py-4">
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-grad text-white shadow-md">
          <Sparkles size={19} />
        </div>
        <div className="min-w-0">
          <div className="truncate text-heading text-xl font-semibold text-text-dark">
            {activeConversation?.title || 'Happabi AI'}
          </div>
          <div className="text-xs font-bold text-text-light">Trợ lý chăm sóc mẹ và bé</div>
        </div>
      </div>
    </div>

    <div className="flex shrink-0 items-center gap-2">
      <Btn type="button" size="sm" variant="ghost" onClick={onRefresh}>
        <RefreshCcw size={15} />
        Tải lại
      </Btn>
    </div>
  </div>
);

export default ChatHeader;
