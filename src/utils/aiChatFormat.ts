import type { ChatMessage } from '../types/aiChat';

export const AI_CHAT_SUGGESTIONS = [
  'Bé sơ sinh ngủ ngày nhiều có bình thường không?',
  'Mẹ sau sinh cần chú ý dấu hiệu nguy hiểm nào?',
  'Cách vệ sinh rốn cho bé an toàn?',
  'Khi nào nên đặt lịch nurse hỗ trợ tại nhà?',
];

export const formatChatDateTime = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  }).format(date);
};

export const conversationTitleFromMessage = (message: string) => {
  const title = message.trim().replace(/\s+/g, ' ');
  return title.length > 72 ? `${title.slice(0, 69)}...` : title || 'Cuộc trò chuyện mới';
};

export const makeTempChatMessage = (content: string): ChatMessage => ({
  id: `temp-${Date.now()}`,
  role: 'USER',
  content,
  createdAt: new Date().toISOString(),
  isPending: true,
});
