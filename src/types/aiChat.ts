export type ChatRole = 'USER' | 'ASSISTANT' | 'SYSTEM';

export interface Conversation {
  id: string;
  userId?: string;
  title?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  modelUsed?: string;
  inputTokens?: number;
  outputTokens?: number;
  createdAt?: string;
  isPending?: boolean;
}

export interface AiChatResponse {
  conversationId: string;
  userMessage?: ChatMessage;
  assistantMessage?: ChatMessage;
  modelUsed?: string;
  resolutionSource?: string;
  ragScore?: number;
  pendingReviewCreated?: boolean;
}
