import { Loader2, MessageSquareText, RefreshCw, Send, Sparkles, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { feedbackApi, type UserFeedback, type UserFeedbackCategory } from '../api/feedbackApi';
import Btn from '../components/common/Btn';
import Card from '../components/common/Card';
import Topbar from '../components/layout/Topbar';
import { useAuth } from '../contexts/AuthContext';
import { getApiErrorMessage } from '../utils/apiError';

const categoryLabel: Record<UserFeedbackCategory, string> = {
  APP_EXPERIENCE: 'Trải nghiệm app',
  BOOKING: 'Đặt lịch',
  PAYMENT: 'Thanh toán',
  CHAT_AI: 'Chat & AI',
  NURSE_ONBOARDING: 'Hồ sơ nurse',
  DOCTOR_REVIEW: 'Duyệt hồ sơ',
  SUGGESTION: 'Đề xuất tính năng',
  OTHER: 'Khác',
};

const statusLabel: Record<string, string> = {
  NEW: 'Mới gửi',
  REVIEWING: 'Đang xem xét',
  PLANNED: 'Đã lên kế hoạch',
  RESOLVED: 'Đã xử lý',
  CLOSED: 'Đã đóng',
};

const statusClass: Record<string, string> = {
  NEW: 'border-amber-200 bg-amber-50 text-amber-700',
  REVIEWING: 'border-sky-200 bg-sky-50 text-sky-700',
  PLANNED: 'border-violet-200 bg-violet-50 text-violet-700',
  RESOLVED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  CLOSED: 'border-slate-200 bg-slate-50 text-slate-700',
};

const ratingText: Record<number, string> = {
  1: 'Rất chưa hài lòng',
  2: 'Chưa hài lòng',
  3: 'Bình thường',
  4: 'Hài lòng',
  5: 'Rất hài lòng',
};

const categories = Object.keys(categoryLabel) as UserFeedbackCategory[];

const formatDateTime = (value?: string) => {
  if (!value) return '--';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
};

const FeedbackPage = () => {
  const { primaryRole } = useAuth();
  const [feedbacks, setFeedbacks] = useState<UserFeedback[]>([]);
  const [category, setCategory] = useState<UserFeedbackCategory>('APP_EXPERIENCE');
  const [rating, setRating] = useState<number | undefined>(5);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const roleTitle = useMemo(() => {
    if (primaryRole === 'NURSE') return 'Góp ý từ nurse';
    if (primaryRole === 'DOCTOR') return 'Góp ý từ doctor';
    return 'Góp ý của mẹ';
  }, [primaryRole]);

  const loadFeedbacks = async () => {
    setIsLoading(true);
    setError('');
    try {
      const page = await feedbackApi.getMine();
      setFeedbacks(page.content ?? []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không tải được danh sách góp ý.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadFeedbacks();
  }, []);

  const submitFeedback = async () => {
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await feedbackApi.createMine({
        category,
        rating,
        title: title.trim(),
        message: message.trim(),
      });
      setTitle('');
      setMessage('');
      setRating(5);
      setSuccess('Cảm ơn bạn. Góp ý đã được gửi tới đội ngũ Happabi.');
      await loadFeedbacks();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không gửi được góp ý. Vui lòng kiểm tra nội dung.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = title.trim().length >= 5 && message.trim().length >= 10 && !isSubmitting;

  return (
    <div className="pb-10">
      <Topbar
        title={roleTitle}
        subtitle="Chia sẻ điều bạn muốn Happabi cải thiện để sản phẩm tốt hơn mỗi tuần."
      />

      {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}
      {success && <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{success}</div>}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(360px,1.05fr)]">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-lav-100 bg-gradient-to-br from-white via-[#fff8fb] to-lav-50 p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lav-50 text-lav-dark">
                <MessageSquareText size={23} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-text-dark">Gửi góp ý</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-text-mid">
                  Nội dung góp ý được gửi cho admin để xem xét cải tiến app. Phần này không dùng cho báo cáo sự cố khẩn cấp.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-6">
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-wider text-text-light">Chủ đề</label>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value as UserFeedbackCategory)}
                className="w-full rounded-2xl border border-lav-100 bg-white px-4 py-3 text-sm font-bold text-text-dark outline-none focus:border-lav-300"
              >
                {categories.map((item) => (
                  <option key={item} value={item}>{categoryLabel[item]}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="block text-xs font-black uppercase tracking-wider text-text-light">Mức hài lòng</label>
                <span className="text-xs font-black text-amber-600">{rating ? ratingText[rating] : 'Chưa chọn'}</span>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => {
                  const active = Boolean(rating && rating >= value);
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl border text-sm font-black transition hover:-translate-y-0.5 ${
                        active
                          ? 'border-amber-300 bg-amber-50 text-amber-500 shadow-[0_10px_24px_rgba(245,158,11,0.16)]'
                          : 'border-lav-100 bg-white text-text-light hover:border-amber-200 hover:text-amber-400'
                      }`}
                      aria-label={`${value} sao`}
                    >
                      <Star size={18} fill={active ? 'currentColor' : 'none'} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-wider text-text-light">Tiêu đề</label>
              <input
                value={title}
                maxLength={120}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ví dụ: Cần lọc nurse theo ngày tốt hơn"
                className="w-full rounded-2xl border border-lav-100 bg-white px-4 py-3 text-sm font-bold text-text-dark outline-none focus:border-lav-300"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-wider text-text-light">Nội dung</label>
              <textarea
                value={message}
                maxLength={2000}
                rows={7}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Mô tả điều bạn gặp phải hoặc ý tưởng cải tiến..."
                className="w-full resize-none rounded-2xl border border-lav-100 bg-white px-4 py-3 text-sm font-bold leading-6 text-text-dark outline-none focus:border-lav-300"
              />
              <div className="mt-1 text-right text-xs font-bold text-text-light">{message.length}/2000</div>
            </div>

            <Btn full disabled={!canSubmit} onClick={submitFeedback}>
              {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
              Gửi góp ý
            </Btn>
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-lav-100 bg-white px-5 py-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-lav-dark" />
                <h2 className="text-lg font-black text-text-dark">Góp ý gần đây</h2>
              </div>
              <p className="mt-1 text-xs font-bold text-text-light">Theo dõi phản hồi từ admin.</p>
            </div>
            <Btn variant="soft" size="sm" onClick={loadFeedbacks} disabled={isLoading}>
              <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
              Làm mới
            </Btn>
          </div>

          {isLoading ? (
            <div className="flex h-[420px] items-center justify-center">
              <Loader2 className="animate-spin text-lav-dark" size={32} />
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="flex h-[420px] items-center justify-center p-8 text-center text-sm font-bold text-text-light">
              Bạn chưa gửi góp ý nào.
            </div>
          ) : (
            <div className="max-h-[720px] divide-y divide-lav-100 overflow-y-auto">
              {feedbacks.map((item) => (
                <div key={item.id} className="px-5 py-4">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-black text-text-dark">{item.title}</div>
                      <div className="mt-1 text-xs font-bold text-text-light">{categoryLabel[item.category]} · {formatDateTime(item.createdAt)}</div>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-black ${statusClass[item.status]}`}>
                      {statusLabel[item.status]}
                    </span>
                  </div>
                  <p className="line-clamp-3 text-sm font-semibold leading-6 text-text-mid">{item.message}</p>
                  {item.adminNote && (
                    <div className="mt-3 rounded-xl border border-lav-100 bg-lav-50 px-3 py-2 text-xs font-bold text-text-mid">
                      Admin: {item.adminNote}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default FeedbackPage;
