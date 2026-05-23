import { Loader2, Send } from 'lucide-react';
import { useState, type FormEvent, type KeyboardEvent } from 'react';
import Btn from '../common/Btn';

interface ChatComposerProps {
  isSending: boolean;
  onSend: (message: string) => Promise<boolean>;
}

const ChatComposer = ({ isSending, onSend }: ChatComposerProps) => {
  const [draft, setDraft] = useState('');

  const sendDraft = async () => {
    const message = draft.trim();
    if (!message || isSending) return;

    const sent = await onSend(message);
    if (sent) {
      setDraft('');
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendDraft();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendDraft();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-lav-200 bg-white px-5 py-4">
      <div className="flex items-end gap-3">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nhập câu hỏi cho Happabi AI..."
          rows={2}
          maxLength={8000}
          className="max-h-36 min-h-[52px] flex-1 resize-none rounded-2xl border border-lav-200 bg-[#fff9fb] px-4 py-3 text-[15px] font-semibold leading-6 text-text-dark outline-none transition-colors placeholder:text-text-light focus:border-lav-acc focus:bg-white focus:ring-4 focus:ring-lav-100"
        />
        <Btn type="submit" size="lg" disabled={isSending || !draft.trim()} className="h-[52px] px-5">
          {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          Gửi
        </Btn>
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-text-light">
        <span>Enter để gửi, Shift + Enter để xuống dòng.</span>
        <span>{draft.length}/8000</span>
      </div>
    </form>
  );
};

export default ChatComposer;
