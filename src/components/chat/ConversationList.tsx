import { Clock3, Loader2, MessageCircle, Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import Btn from '../common/Btn';
import Card from '../common/Card';
import Input from '../common/Input';
import type { Conversation } from '../../types/aiChat';
import { formatChatDateTime } from '../../utils/aiChatFormat';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  isLoading: boolean;
  isCreating: boolean;
  onCreate: (title?: string) => void;
  onSelect: (conversationId: string) => void;
}

const ConversationList = ({
  conversations,
  activeConversationId,
  isLoading,
  isCreating,
  onCreate,
  onSelect,
}: ConversationListProps) => {
  const [isNaming, setIsNaming] = useState(false);
  const [title, setTitle] = useState('');

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onCreate(title.trim() || undefined);
    setTitle('');
    setIsNaming(false);
  };

  return (
    <Card className="flex min-h-0 flex-col p-0">
      <div className="border-b border-lav-200 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-serif text-xl font-black text-text-dark">Hội thoại</div>
            <div className="mt-1 text-xs font-bold text-text-light">{conversations.length} cuộc trò chuyện</div>
          </div>
          <Btn
            type="button"
            size="sm"
            variant="soft"
            disabled={isCreating}
            onClick={() => setIsNaming((current) => !current)}
            aria-label="Tạo hội thoại mới"
          >
            {isCreating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Mới
          </Btn>
        </div>

        {isNaming && (
          <form onSubmit={handleCreate} className="mt-4 rounded-2xl border border-lav-200 bg-[#fff9fb] p-3">
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Tên cuộc trò chuyện"
              maxLength={160}
              className="h-10 py-2 text-sm"
            />
            <div className="flex items-center justify-end gap-2">
              <Btn type="button" size="xs" variant="ghost" onClick={() => setIsNaming(false)}>
                Hủy
              </Btn>
              <Btn type="submit" size="xs" disabled={isCreating}>
                Tạo
              </Btn>
            </div>
          </form>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-lav-dark">
            <Loader2 size={24} className="animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-lav-100 text-lav-dark">
              <MessageCircle size={22} />
            </div>
            <div className="font-black text-text-dark">Chưa có hội thoại</div>
            <p className="mt-1 text-sm font-semibold leading-5 text-text-light">
              Gửi câu hỏi đầu tiên, hệ thống sẽ tự tạo hội thoại cho bạn.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((item) => {
              const selected = item.id === activeConversationId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className={`w-full rounded-2xl border p-3 text-left transition-all ${
                    selected
                      ? 'border-lav-300 bg-lav-100 shadow-sm'
                      : 'border-transparent bg-white hover:border-lav-200 hover:bg-[#fff9fb]'
                  }`}
                >
                  <div className="line-clamp-2 text-sm font-black text-text-dark">
                    {item.title || 'Cuộc trò chuyện mới'}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-text-light">
                    <Clock3 size={12} />
                    {formatChatDateTime(item.updatedAt || item.createdAt) || 'Vừa tạo'}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
};

export default ConversationList;
