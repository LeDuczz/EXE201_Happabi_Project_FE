import axiosClient from './axiosClient';
import type { AiChatResponse, ChatMessage, Conversation, ConversationPage } from '../types/aiChat';

const AI_CHAT_BASE_URL = '/api/v1/ai-chat';

export const aiChatApi = {
  async getConversations(keyword = '', page = 0, size = 20) {
    const response = await axiosClient.get(`${AI_CHAT_BASE_URL}/conversations`, {
      params: {
        keyword: keyword.trim() || undefined,
        page,
        size,
      },
    });
    return (response.data?.data ?? {
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: page,
      size,
    }) as ConversationPage;
  },

  async createConversation(title: string) {
    const response = await axiosClient.post(`${AI_CHAT_BASE_URL}/conversations`, { title });
    return response.data?.data as Conversation;
  },

  async getMessages(conversationId: string) {
    const response = await axiosClient.get(`${AI_CHAT_BASE_URL}/conversations/${conversationId}/messages`);
    return (response.data?.data ?? []) as ChatMessage[];
  },

  async sendMessage(conversationId: string, message: string) {
    const response = await axiosClient.post(`${AI_CHAT_BASE_URL}/conversations/${conversationId}/messages`, { message });
    return response.data?.data as AiChatResponse;
  },
};
