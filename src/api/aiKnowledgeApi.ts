import axiosClient from './axiosClient';

export type KnowledgeStatus = 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';

export interface KnowledgeItem {
  id: string;
  title: string;
  question: string;
  answer: string;
  context?: string;
  sourceType?: string;
  sourceId?: string;
  language?: string;
  status: KnowledgeStatus;
  vectorIndexed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgePage {
  content: KnowledgeItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface UpsertKnowledgeChunkPayload {
  title: string;
  question: string;
  answer: string;
  content: string;
  sourceType?: string;
  sourceId?: string;
  language?: string;
  verified?: boolean;
}

const unwrap = <T>(response: { data?: { data?: T } }) => response.data?.data as T;

export const aiKnowledgeApi = {
  getItems: async (status?: KnowledgeStatus | 'ALL', keyword = '', page = 0, size = 20) => {
    const response = await axiosClient.get('/api/v1/ai-chat/knowledge-chunks/items', {
      params: {
        page,
        size,
        status: status && status !== 'ALL' ? status : undefined,
        keyword: keyword.trim() || undefined,
      },
    });
    return unwrap<KnowledgePage>(response) ?? {
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: page,
      size,
    };
  },

  createChunk: async (payload: UpsertKnowledgeChunkPayload) => {
    const response = await axiosClient.post('/api/v1/ai-chat/knowledge-chunks', payload);
    return unwrap<KnowledgeItem>(response);
  },

  reviewItem: async (knowledgeItemId: string, approved: boolean) => {
    const response = await axiosClient.patch(`/api/v1/ai-chat/knowledge-chunks/${knowledgeItemId}/review`, {
      approved,
    });
    return unwrap<KnowledgeItem>(response);
  },

  reindexItem: async (knowledgeItemId: string) => {
    const response = await axiosClient.post(`/api/v1/ai-chat/knowledge-chunks/${knowledgeItemId}/reindex`);
    return unwrap<KnowledgeItem>(response);
  },

  reindexVerifiedItems: async () => {
    const response = await axiosClient.post('/api/v1/ai-chat/knowledge-chunks/reindex');
    return unwrap<KnowledgeItem[]>(response) ?? [];
  },
};
