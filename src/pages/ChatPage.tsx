import { AlertCircle } from 'lucide-react';
import Card from '../components/common/Card';
import ChatComposer from '../components/chat/ChatComposer';
import ChatHeader from '../components/chat/ChatHeader';
import ConversationList from '../components/chat/ConversationList';
import MessageList from '../components/chat/MessageList';
import Topbar from '../components/layout/Topbar';
import { useAiChat } from '../hooks/useAiChat';

const ChatPage = () => {
  const chat = useAiChat();

  return (
    <>
      <Topbar title="Chat & AI hỗ trợ" subtitle="Hỏi nhanh về chăm sóc mẹ và bé, lịch hỗ trợ, hoặc kiến thức sau sinh." />

      <div className="grid h-[calc(100vh-124px)] min-h-[620px] grid-cols-[320px_minmax(0,1fr)] gap-5 overflow-hidden">
        <ConversationList
          conversations={chat.conversations}
          activeConversationId={chat.activeConversationId}
          isLoading={chat.isLoadingConversations}
          isCreating={chat.isCreating}
          onCreate={(title) => chat.createConversation(title)}
          onSelect={chat.setActiveConversationId}
        />

        <Card className="flex min-h-0 flex-col overflow-hidden p-0">
          <ChatHeader
            activeConversation={chat.activeConversation}
            onRefresh={chat.loadConversations}
          />

          {chat.error && (
            <div className="mx-6 mt-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-danger-bg p-3 text-sm font-bold text-danger">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{chat.error}</span>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <MessageList
              messages={chat.messages}
              isLoading={chat.isLoadingMessages}
              isSending={chat.isSending}
              onSendSuggestion={chat.sendMessage}
            />
          </div>

          <ChatComposer isSending={chat.isSending} onSend={chat.sendMessage} />
        </Card>
      </div>
    </>
  );
};

export default ChatPage;
