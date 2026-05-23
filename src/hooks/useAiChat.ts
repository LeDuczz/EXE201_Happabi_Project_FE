import { useCallback, useEffect, useMemo, useState } from 'react';
import { aiChatApi } from '../api/aiChatApi';
import type { AiChatResponse, ChatMessage, Conversation } from '../types/aiChat';
import { conversationTitleFromMessage, makeTempChatMessage } from '../utils/aiChatFormat';
import { getApiErrorMessage } from '../utils/apiError';

interface CreateConversationOptions {
  select?: boolean;
}

export const useAiChat = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [lastReplyMeta, setLastReplyMeta] = useState<AiChatResponse | null>(null);
  const [error, setError] = useState('');

  const activeConversation = useMemo(
    () => conversations.find((item) => item.id === activeConversationId) ?? null,
    [activeConversationId, conversations],
  );

  const loadConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    setError('');

    try {
      const items = await aiChatApi.getConversations();
      setConversations(items);
      setActiveConversationId((current) => current ?? items[0]?.id ?? null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không tải được danh sách hội thoại AI.'));
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  const loadMessages = useCallback(async (conversationId: string) => {
    setIsLoadingMessages(true);
    setError('');

    try {
      setMessages(await aiChatApi.getMessages(conversationId));
      setLastReplyMeta(null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không tải được nội dung hội thoại.'));
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  const createConversation = useCallback(async (
    title = 'Cuộc trò chuyện mới',
    options: CreateConversationOptions = { select: true },
  ) => {
    setIsCreating(true);
    setError('');

    try {
      const conversation = await aiChatApi.createConversation(title);
      setConversations((current) => [conversation, ...current.filter((item) => item.id !== conversation.id)]);

      if (options.select !== false) {
        setActiveConversationId(conversation.id);
        setMessages([]);
        setLastReplyMeta(null);
      }

      return conversation;
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không tạo được hội thoại mới.'));
      return null;
    } finally {
      setIsCreating(false);
    }
  }, []);

  const sendMessage = useCallback(async (rawMessage: string) => {
    const content = rawMessage.trim();
    if (!content || isSending) return false;

    if (content.length > 8000) {
      setError('Tin nhắn không được vượt quá 8000 ký tự.');
      return false;
    }

    setError('');
    setIsSending(true);

    const tempMessage = makeTempChatMessage(content);
    setMessages((current) => [...current, tempMessage]);

    try {
      let conversationId = activeConversationId;
      if (!conversationId) {
        const conversation = await createConversation(conversationTitleFromMessage(content), { select: false });
        conversationId = conversation?.id ?? null;
      }

      if (!conversationId) {
        setMessages((current) => current.filter((item) => item.id !== tempMessage.id));
        return false;
      }

      const payload = await aiChatApi.sendMessage(conversationId, content);
      setLastReplyMeta(payload);
      setMessages((current) => {
        const withoutTemp = current.filter((item) => item.id !== tempMessage.id);
        return [
          ...withoutTemp,
          ...(payload.userMessage ? [payload.userMessage] : []),
          ...(payload.assistantMessage ? [payload.assistantMessage] : []),
        ];
      });
      await loadConversations();
      setActiveConversationId(conversationId);
      return true;
    } catch (err) {
      setMessages((current) => current.filter((item) => item.id !== tempMessage.id));
      setError(getApiErrorMessage(err, 'AI chat đang bận. Vui lòng thử lại sau.'));
      return false;
    } finally {
      setIsSending(false);
    }
  }, [activeConversationId, createConversation, isSending, loadConversations]);

  useEffect(() => {
    void Promise.resolve().then(loadConversations);
  }, [loadConversations]);

  useEffect(() => {
    if (activeConversationId) {
      void Promise.resolve().then(() => loadMessages(activeConversationId));
    } else {
      void Promise.resolve().then(() => setMessages([]));
    }
  }, [activeConversationId, loadMessages]);

  return {
    conversations,
    activeConversation,
    activeConversationId,
    messages,
    isLoadingConversations,
    isLoadingMessages,
    isCreating,
    isSending,
    lastReplyMeta,
    error,
    setActiveConversationId,
    createConversation,
    loadConversations,
    sendMessage,
  };
};
