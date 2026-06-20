import { CheckCircle2, Loader2, MessageSquareText, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  feedbackApi,
  type UserFeedback,
  type UserFeedbackCategory,
  type UserFeedbackStatus,
} from '../../api/feedbackApi';
import Btn from '../../components/common/Btn';
import Card from '../../components/common/Card';
import Topbar from '../../components/layout/Topbar';
import { getApiErrorMessage } from '../../utils/apiError';

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

const statusLabel: Record<UserFeedbackStatus | 'ALL', string> = {
  ALL: 'Tất cả',
  NEW: 'Mới gửi',
  REVIEWING: 'Đang xem xét',
  PLANNED: 'Đã lên kế hoạch',
  RESOLVED: 'Đã xử lý',
  CLOSED: 'Đã đóng',
};

const statusClass: Record<UserFeedbackStatus, string> = {
  NEW: 'border-amber-200 bg-amber-50 text-amber-700',
  REVIEWING: 'border-sky-200 bg-sky-50 text-sky-700',
  PLANNED: 'border-violet-200 bg-violet-50 text-violet-700',
  RESOLVED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  CLOSED: 'border-slate-200 bg-slate-50 text-slate-700',
};

const roleLabel: Record<string, string> = {
  MOTHER: 'Mẹ',
  NURSE: 'Nurse',
  DOCTOR: 'Doctor',
};

const reviewStatuses: Exclude<UserFeedbackStatus, 'NEW'>[] = ['REVIEWING', 'PLANNED', 'RESOLVED', 'CLOSED'];

const formatDateTime = (value?: string) => {
  if (!value) return '--';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
};

const AdminFeedbacks = () => {
  const [feedbacks, setFeedbacks] = useState<UserFeedback[]>([]);
  const [activeStatus, setActiveStatus] = useState<UserFeedbackStatus | 'ALL'>('NEW');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [nextStatus, setNextStatus] = useState<Exclude<UserFeedbackStatus, 'NEW'>>('REVIEWING');
  const [adminNote, setAdminNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadFeedbacks = async () => {
    setIsLoading(true);
    setError('');
    try {
      const page = await feedbackApi.getAdminFeedbacks(activeStatus);
      const content = page.content ?? [];
      setFeedbacks(content);
      setSelectedId((current) => current && content.some((item) => item.id === current) ? current : content[0]?.id ?? null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không tải được danh sách góp ý.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadFeedbacks();
  }, [activeStatus]);

  const selectedFeedback = useMemo(
    () => feedbacks.find((item) => item.id === selectedId) ?? feedbacks[0] ?? null,
    [feedbacks, selectedId],
  );

  useEffect(() => {
    if (!selectedFeedback) return;
    setNextStatus(selectedFeedback.status === 'NEW' ? 'REVIEWING' : selectedFeedback.status);
    setAdminNote(selectedFeedback.adminNote ?? '');
  }, [selectedFeedback?.id]);

  const updateStatus = async () => {
    if (!selectedFeedback) return;
    setIsUpdating(true);
    setError('');
    setSuccess('');
    try {
      await feedbackApi.updateStatus(selectedFeedback.id, {
        status: nextStatus,
        adminNote: adminNote.trim() || undefined,
      });
      setSuccess('Đã cập nhật trạng thái góp ý.');
      await loadFeedbacks();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không cập nhật được góp ý.'));
    } finally {
      setIsUpdating(false);
    }
  };

  const newCount = feedbacks.filter((item) => item.status === 'NEW').length;

  return (
    <div className="pb-10">
      <Topbar
        title="Góp ý người dùng"
        subtitle="Theo dõi góp ý từ mother, nurse và doctor để cải tiến sản phẩm."
      />

      {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}
      {success && <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{success}</div>}

      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <div className="text-xs font-black uppercase tracking-wider text-text-light">Mới trong bộ lọc</div>
          <div className="mt-2 text-3xl font-black text-text-dark">{newCount}</div>
        </Card>
        <Card className="p-5 md:col-span-2">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lav-50 text-lav-dark">
              <MessageSquareText size={20} />
            </div>
            <p className="text-sm font-semibold leading-6 text-text-mid">
              Feedback là nguồn cải tiến sản phẩm, không thay thế báo cáo sự cố. Những vấn đề cần xử lý ca làm vẫn đi qua module sự cố.
            </p>
          </div>
        </Card>
      </div>

      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['NEW', 'REVIEWING', 'PLANNED', 'RESOLVED', 'CLOSED', 'ALL'] as Array<UserFeedbackStatus | 'ALL'>).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setActiveStatus(status)}
              className={`whitespace-nowrap rounded-full px-5 py-2 text-xs font-black transition ${
                activeStatus === status
                  ? 'bg-lav-acc text-white shadow-[0_8px_22px_rgba(192,132,252,.25)]'
                  : 'bg-white text-lav-dark ring-1 ring-lav-200 hover:bg-lav-50'
              }`}
            >
              {statusLabel[status]}
            </button>
          ))}
        </div>
        <Btn variant="soft" size="sm" onClick={loadFeedbacks} disabled={isLoading}>
          <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          Làm mới
        </Btn>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(360px,0.85fr)_minmax(0,1.15fr)]">
        <Card className="p-0">
          <div className="border-b border-lav-100 px-5 py-4">
            <h2 className="text-lg font-black text-text-dark">Danh sách góp ý</h2>
          </div>

          {isLoading ? (
            <div className="flex h-[420px] items-center justify-center">
              <Loader2 className="animate-spin text-lav-dark" size={32} />
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="p-8 text-center text-sm font-bold text-text-light">Chưa có góp ý phù hợp.</div>
          ) : (
            <div className="divide-y divide-lav-100">
              {feedbacks.map((item) => {
                const selected = selectedFeedback?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`block w-full px-5 py-4 text-left transition hover:bg-lav-50 ${selected ? 'bg-lav-50' : 'bg-white'}`}
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black text-text-dark">{item.title}</div>
                        <div className="mt-1 truncate text-xs font-bold text-text-mid">
                          {item.submittedByName} · {roleLabel[item.submittedByRole] ?? item.submittedByRole}
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-black ${statusClass[item.status]}`}>
                        {statusLabel[item.status]}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-text-light">{categoryLabel[item.category]} · {formatDateTime(item.createdAt)}</div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="min-h-[560px]">
          {!selectedFeedback ? (
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center text-center">
              <MessageSquareText className="mb-4 text-lav-dark opacity-25" size={54} />
              <h3 className="text-xl font-black text-text-dark">Chưa chọn góp ý</h3>
              <p className="mt-2 text-sm font-bold text-text-mid">Chọn một góp ý bên trái để xem chi tiết.</p>
            </div>
          ) : (
            <div>
              <div className="mb-5 flex flex-col gap-3 border-b border-lav-100 pb-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.08em] text-text-light">{categoryLabel[selectedFeedback.category]}</div>
                  <h2 className="mt-1 text-2xl font-black text-text-dark">{selectedFeedback.title}</h2>
                  <p className="mt-1 text-sm font-bold text-text-mid">
                    {selectedFeedback.submittedByName} · {roleLabel[selectedFeedback.submittedByRole] ?? selectedFeedback.submittedByRole} · {formatDateTime(selectedFeedback.createdAt)}
                  </p>
                </div>
                <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${statusClass[selectedFeedback.status]}`}>
                  {statusLabel[selectedFeedback.status]}
                </span>
              </div>

              <div className="mb-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-lav-100 bg-lav-50 p-4">
                  <div className="text-xs font-black uppercase text-text-light">Mức hài lòng</div>
                  <div className="mt-1 text-lg font-black text-text-dark">{selectedFeedback.rating ? `${selectedFeedback.rating}/5` : 'Không đánh giá'}</div>
                </div>
                <div className="rounded-xl border border-lav-100 bg-lav-50 p-4">
                  <div className="text-xs font-black uppercase text-text-light">Cập nhật gần nhất</div>
                  <div className="mt-1 text-sm font-black text-text-dark">{formatDateTime(selectedFeedback.updatedAt)}</div>
                </div>
              </div>

              <div className="mb-5 rounded-xl border border-lav-100 bg-white p-4">
                <div className="mb-2 text-xs font-black uppercase text-text-light">Nội dung góp ý</div>
                <p className="whitespace-pre-wrap text-sm font-bold leading-6 text-text-dark">{selectedFeedback.message}</p>
              </div>

              <div className="rounded-xl border border-lav-100 bg-lav-50 p-4">
                <div className="mb-3 text-sm font-black text-text-dark">Xử lý của admin</div>
                <div className="grid gap-3 sm:grid-cols-[220px_1fr]">
                  <select
                    value={nextStatus}
                    onChange={(event) => setNextStatus(event.target.value as Exclude<UserFeedbackStatus, 'NEW'>)}
                    className="rounded-xl border border-lav-100 bg-white px-4 py-3 text-sm font-bold text-text-dark outline-none focus:border-lav-300"
                  >
                    {reviewStatuses.map((status) => (
                      <option key={status} value={status}>{statusLabel[status]}</option>
                    ))}
                  </select>
                  <textarea
                    value={adminNote}
                    maxLength={500}
                    rows={4}
                    onChange={(event) => setAdminNote(event.target.value)}
                    placeholder="Ghi chú phản hồi cho người gửi..."
                    className="resize-none rounded-xl border border-lav-100 bg-white px-4 py-3 text-sm font-bold leading-6 text-text-dark outline-none focus:border-lav-300"
                  />
                </div>
                <div className="mt-3 flex justify-end">
                  <Btn disabled={isUpdating} onClick={updateStatus}>
                    {isUpdating ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                    Cập nhật góp ý
                  </Btn>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminFeedbacks;
