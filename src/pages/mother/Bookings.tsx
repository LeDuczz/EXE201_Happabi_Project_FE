import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Image as ImageIcon,
  Loader2,
  MessageSquareText,
  Plus,
  RefreshCw,
  Send,
  Star,
  XCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import nurseReviewApi from '../../api/nurseReviewApi';
import workSessionApi from '../../api/workSessionApi';
import Btn from '../../components/common/Btn';
import Card from '../../components/common/Card';
import Topbar from '../../components/layout/Topbar';
import { getApiErrorMessage } from '../../utils/apiError';
import type { NurseReview, NurseReviewTag } from '../../types/nurseReview';
import type { WorkSession, WorkSessionStatus } from '../../types/workSession';

type SessionBucket = 'UPCOMING' | 'ACTION_NEEDED' | 'HISTORY';

const bucketOptions: Array<{ key: SessionBucket; label: string }> = [
  { key: 'UPCOMING', label: 'Sắp tới' },
  { key: 'ACTION_NEEDED', label: 'Cần xử lý' },
  { key: 'HISTORY', label: 'Lịch sử' },
];

const statusLabel: Record<WorkSessionStatus, string> = {
  SCHEDULED: 'Sắp diễn ra',
  IN_PROGRESS: 'Đang thực hiện',
  PENDING_MOTHER_CONFIRMATION: 'Chờ xác nhận',
  COMPLETED: 'Hoàn thành',
  AUTO_CONFIRMED: 'Tự xác nhận',
  REPORTED: 'Đã báo cáo',
  CANCELLED: 'Đã hủy',
};

const reviewTags: Array<{ value: NurseReviewTag; label: string }> = [
  { value: 'ON_TIME', label: 'Đúng giờ' },
  { value: 'PROFESSIONAL', label: 'Chuyên nghiệp' },
  { value: 'GENTLE_WITH_BABY', label: 'Nhẹ nhàng với bé' },
  { value: 'CLEAR_COMMUNICATION', label: 'Trao đổi rõ ràng' },
  { value: 'CLEAN_AND_CAREFUL', label: 'Sạch sẽ, cẩn thận' },
  { value: 'HELPFUL_GUIDANCE', label: 'Hướng dẫn hữu ích' },
  { value: 'WOULD_BOOK_AGAIN', label: 'Muốn đặt lại' },
];

const bucketOf = (status: WorkSessionStatus): SessionBucket => {
  if (status === 'PENDING_MOTHER_CONFIRMATION' || status === 'REPORTED') return 'ACTION_NEEDED';
  if (status === 'COMPLETED' || status === 'AUTO_CONFIRMED' || status === 'CANCELLED') return 'HISTORY';
  return 'UPCOMING';
};

const canReview = (session: WorkSession) => ['COMPLETED', 'AUTO_CONFIRMED'].includes(session.status);

const formatDateTime = (value?: string) => {
  if (!value) return 'Chưa có';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const formatTimeRange = (session: WorkSession) =>
  `${formatDateTime(session.scheduledStartAt)} - ${new Date(session.scheduledEndAt).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;

const progressOf = (session: WorkSession) => {
  if (!session.checklistItems.length) return 0;
  const done = session.checklistItems.filter((item) => item.status === 'COMPLETED').length;
  return Math.round((done / session.checklistItems.length) * 100);
};

const statusClass = (status: WorkSessionStatus) => {
  if (status === 'PENDING_MOTHER_CONFIRMATION' || status === 'REPORTED') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (status === 'COMPLETED' || status === 'AUTO_CONFIRMED') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'CANCELLED') return 'border-red-200 bg-red-50 text-red-700';
  return 'border-sky-200 bg-sky-50 text-sky-700';
};

const MotherBookings = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeBucket, setActiveBucket] = useState<SessionBucket>('UPCOMING');
  const [reviewsBySession, setReviewsBySession] = useState<Record<string, NurseReview | null>>({});
  const [reportReason, setReportReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [reviewActionId, setReviewActionId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadSessions = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await workSessionApi.getMotherSessions();
      setSessions(data);
      setSelectedId((current) => current ?? data[0]?.id ?? null);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSessions();
  }, []);

  const sessionsByBucket = useMemo(
    () =>
      bucketOptions.reduce<Record<SessionBucket, WorkSession[]>>(
        (groups, bucket) => {
          groups[bucket.key] = sessions.filter((session) => bucketOf(session.status) === bucket.key);
          return groups;
        },
        { UPCOMING: [], ACTION_NEEDED: [], HISTORY: [] },
      ),
    [sessions],
  );

  const visibleSessions = sessionsByBucket[activeBucket];
  const selectedSession =
    sessions.find((session) => session.id === selectedId) ??
    visibleSessions[0] ??
    sessions[0] ??
    null;

  useEffect(() => {
    if (!visibleSessions.length) return;
    if (!selectedId || !visibleSessions.some((session) => session.id === selectedId)) {
      setSelectedId(visibleSessions[0].id);
    }
  }, [selectedId, visibleSessions]);

  useEffect(() => {
    if (!selectedSession || !canReview(selectedSession) || selectedSession.id in reviewsBySession) return;
    let ignore = false;
    nurseReviewApi
      .getMyWorkSessionReview(selectedSession.id)
      .then((review) => {
        if (!ignore) setReviewsBySession((current) => ({ ...current, [selectedSession.id]: review }));
      })
      .catch((err) => {
        if (!ignore && err?.response?.status === 404) {
          setReviewsBySession((current) => ({ ...current, [selectedSession.id]: null }));
        }
      });
    return () => {
      ignore = true;
    };
  }, [selectedSession, reviewsBySession]);

  const runSessionAction = async (id: string, action: () => Promise<WorkSession>) => {
    setActionId(id);
    setError('');
    try {
      const updated = await action();
      setSessions((current) => current.map((session) => (session.id === updated.id ? updated : session)));
      setActiveBucket(bucketOf(updated.status));
      setSelectedId(updated.id);
      setReportReason('');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setActionId(null);
    }
  };

  const submitReview = async (sessionId: string, rating: number, tags: NurseReviewTag[], comment: string) => {
    setReviewActionId(sessionId);
    setError('');
    try {
      const review = await nurseReviewApi.createMyWorkSessionReview(sessionId, {
        rating,
        tags,
        comment: comment.trim() || undefined,
      });
      setReviewsBySession((current) => ({ ...current, [sessionId]: review }));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setReviewActionId(null);
    }
  };

  return (
    <div className="pb-10">
      <Topbar title="Đơn của tôi" subtitle="Theo dõi lịch chăm sóc, tiến độ checklist và xác nhận hoàn thành ca." />

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-bold text-red-700">
          {error}
        </div>
      )}

      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="grid grid-cols-3 gap-2 md:w-[520px]">
          {bucketOptions.map((bucket) => (
            <button
              key={bucket.key}
              type="button"
              onClick={() => setActiveBucket(bucket.key)}
              className={`rounded-xl border px-3 py-2 text-left transition ${
                activeBucket === bucket.key
                  ? 'border-lav-300 bg-white text-lav-dark shadow-sm'
                  : 'border-lav-100 bg-lav-50 text-text-mid hover:bg-white'
              }`}
            >
              <div className="text-[12px] font-semibold">{bucket.label}</div>
              <div className="mt-0.5 text-[18px] font-semibold text-text-dark">{sessionsByBucket[bucket.key].length}</div>
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <Btn variant="outline" onClick={loadSessions} disabled={isLoading}>
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Làm mới
          </Btn>
          <Btn onClick={() => navigate('/mother/bookings/new')}>
            <Plus size={16} />
            Đặt lịch
          </Btn>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(340px,0.8fr)_minmax(0,1.2fr)]">
        <Card className="p-0">
          <div className="border-b border-lav-100 px-5 py-4">
            <h2 className="text-[17px] font-semibold text-text-dark">Danh sách đơn</h2>
          </div>

          {isLoading ? (
            <div className="flex h-[360px] items-center justify-center">
              <Loader2 className="animate-spin text-lav-dark" size={30} />
            </div>
          ) : visibleSessions.length === 0 ? (
            <div className="p-6 text-center">
              <CalendarDays className="mx-auto text-lav-dark opacity-30" size={42} />
              <p className="mt-3 text-[14px] font-bold text-text-mid">Không có đơn trong mục này.</p>
              <Btn className="mt-4" onClick={() => navigate('/mother/bookings/new')}>
                <Plus size={16} />
                Đặt lịch mới
              </Btn>
            </div>
          ) : (
            <div className="divide-y divide-lav-100">
              {visibleSessions.map((session) => {
                const selected = selectedSession?.id === session.id;
                return (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => setSelectedId(session.id)}
                    className={`block w-full px-5 py-4 text-left transition hover:bg-lav-50 ${
                      selected ? 'bg-lav-50' : 'bg-white'
                    }`}
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-[14px] font-semibold text-text-dark">{session.serviceName}</div>
                        <div className="mt-1 truncate text-[12px] font-bold text-text-mid">{session.nurseName}</div>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClass(session.status)}`}>
                        {statusLabel[session.status]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[12px] font-bold text-text-light">
                      <Clock size={14} />
                      <span className="truncate">{formatTimeRange(session)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="min-h-[520px]">
          {!selectedSession ? (
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center text-center">
              <CalendarDays className="mb-4 text-lav-dark opacity-25" size={54} />
              <h3 className="text-[20px] font-semibold text-text-dark">Chưa chọn đơn</h3>
              <p className="mt-2 text-[14px] font-bold text-text-mid">Chọn một đơn bên trái để xem chi tiết.</p>
            </div>
          ) : (
            <div>
              <div className="mb-5 flex flex-col gap-3 border-b border-lav-100 pb-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-text-light">Chi tiết đơn</div>
                  <h2 className="mt-1 text-[24px] font-semibold leading-tight text-text-dark">{selectedSession.serviceName}</h2>
                  <p className="mt-1 text-[13px] font-bold text-text-mid">
                    Nurse: {selectedSession.nurseName} · {formatTimeRange(selectedSession)}
                  </p>
                </div>
                <span className={`w-fit rounded-full border px-3 py-1 text-[12px] font-semibold ${statusClass(selectedSession.status)}`}>
                  {statusLabel[selectedSession.status]}
                </span>
              </div>

              <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Metric label="Tiến độ" value={`${progressOf(selectedSession)}%`} />
                <Metric label="Check-in" value={formatDateTime(selectedSession.checkedInAt)} />
                <Metric label="Trễ" value={`${selectedSession.lateMinutes ?? 0} phút`} />
                <Metric label="Auto confirm" value={formatDateTime(selectedSession.autoConfirmAt)} />
              </div>

              {selectedSession.status === 'PENDING_MOTHER_CONFIRMATION' && (
                <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-amber-800">
                    <AlertCircle size={16} />
                    Ca này đang chờ mẹ xác nhận.
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Btn
                      disabled={actionId === 'confirm'}
                      onClick={() => runSessionAction('confirm', () => workSessionApi.confirmByMother(selectedSession.id))}
                    >
                      {actionId === 'confirm' ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                      Xác nhận hoàn thành
                    </Btn>
                  </div>
                  <div className="mt-4 grid gap-2">
                    <textarea
                      value={reportReason}
                      onChange={(event) => setReportReason(event.target.value)}
                      rows={3}
                      placeholder="Nhập lý do nếu ca có vấn đề..."
                      className="w-full resize-none rounded-xl border border-amber-200 bg-white px-4 py-3 text-[13px] font-bold text-text-dark outline-none focus:border-amber-300"
                    />
                    <Btn
                      variant="danger"
                      disabled={!reportReason.trim() || actionId === 'report'}
                      onClick={() => runSessionAction('report', () => workSessionApi.reportByMother(selectedSession.id, reportReason))}
                    >
                      {actionId === 'report' ? <Loader2 className="animate-spin" size={16} /> : <XCircle size={16} />}
                      Báo cáo vấn đề
                    </Btn>
                  </div>
                </div>
              )}

              <section className="mb-5">
                <h3 className="mb-3 text-[15px] font-semibold text-text-dark">Checklist</h3>
                {selectedSession.checklistItems.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-lav-200 bg-lav-50 p-4 text-[13px] font-bold text-text-mid">
                    Chưa có checklist cho ca này.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedSession.checklistItems.map((item) => (
                      <div key={item.id} className="rounded-xl border border-lav-100 bg-white p-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold ${
                              item.status === 'COMPLETED' ? 'bg-emerald-500 text-white' : 'bg-lav-100 text-lav-dark'
                            }`}
                          >
                            {item.status === 'COMPLETED' ? <CheckCircle2 size={16} /> : item.sortOrder}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[13px] font-semibold text-text-dark">{item.title}</div>
                            {item.note && <div className="mt-1 text-[12px] font-bold text-text-mid">{item.note}</div>}
                            {item.evidences.length > 0 && <EvidenceGrid evidences={item.evidences} />}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {canReview(selectedSession) && (
                <ReviewPanel
                  session={selectedSession}
                  review={reviewsBySession[selectedSession.id]}
                  isSubmitting={reviewActionId === selectedSession.id}
                  onSubmit={submitReview}
                />
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl border border-lav-100 bg-lav-50 p-3">
    <div className="text-[11px] font-semibold uppercase text-text-light">{label}</div>
    <div className="mt-1 text-[13px] font-semibold text-text-dark">{value}</div>
  </div>
);

const EvidenceGrid = ({ evidences }: { evidences: Array<{ id: string; previewUrl?: string }> }) => (
  <div className="mt-3 flex flex-wrap gap-2">
    {evidences.map((evidence) => (
      <a
        key={evidence.id}
        href={evidence.previewUrl}
        target="_blank"
        rel="noreferrer"
        className="flex h-20 w-24 items-center justify-center overflow-hidden rounded-xl border border-lav-100 bg-lav-50 text-lav-dark"
      >
        {evidence.previewUrl ? (
          <img src={evidence.previewUrl} alt="Evidence" className="h-full w-full object-cover" />
        ) : (
          <ImageIcon size={20} />
        )}
      </a>
    ))}
  </div>
);

const ReviewPanel = ({
  session,
  review,
  isSubmitting,
  onSubmit,
}: {
  session: WorkSession;
  review?: NurseReview | null;
  isSubmitting: boolean;
  onSubmit: (sessionId: string, rating: number, tags: NurseReviewTag[], comment: string) => Promise<void>;
}) => {
  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<NurseReviewTag[]>([]);
  const [comment, setComment] = useState('');

  const toggleTag = (tag: NurseReviewTag) => {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag],
    );
  };

  if (review) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-emerald-700">
          <CheckCircle2 size={16} />
          Bạn đã gửi đánh giá cho ca này.
        </div>
        <RatingStars value={review.rating} readonly />
        {review.comment && <p className="mt-3 text-[13px] font-bold text-text-mid">{review.comment}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-pink-100 bg-pink-50 p-4">
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-pink-dark">
          <MessageSquareText size={18} />
        </div>
        <div>
          <div className="text-[14px] font-semibold text-text-dark">Đánh giá nurse sau ca làm</div>
          <p className="mt-1 text-[12px] font-bold text-text-mid">Không bắt buộc, nhưng giúp hệ thống xếp hạng chính xác hơn.</p>
        </div>
      </div>

      <RatingStars value={rating} onChange={setRating} />

      <div className="mt-4 flex flex-wrap gap-2">
        {reviewTags.map((tag) => (
          <button
            key={tag.value}
            type="button"
            onClick={() => toggleTag(tag.value)}
            className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition ${
              selectedTags.includes(tag.value)
                ? 'border-pink-300 bg-white text-pink-dark'
                : 'border-pink-100 bg-pink-50 text-text-mid hover:bg-white'
            }`}
          >
            {tag.label}
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        rows={3}
        maxLength={1000}
        placeholder={`Bạn muốn ghi chú gì thêm về ${session.nurseName}?`}
        className="mt-4 w-full resize-none rounded-xl border border-pink-100 bg-white px-4 py-3 text-[13px] font-bold text-text-dark outline-none focus:border-pink-300"
      />

      <div className="mt-4 flex justify-end">
        <Btn disabled={isSubmitting || rating < 1} onClick={() => onSubmit(session.id, rating, selectedTags, comment)}>
          {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
          Gửi đánh giá
        </Btn>
      </div>
    </div>
  );
};

const RatingStars = ({
  value,
  readonly = false,
  onChange,
}: {
  value: number;
  readonly?: boolean;
  onChange?: (value: number) => void;
}) => (
  <div className="flex items-center gap-1.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        disabled={readonly}
        onClick={() => onChange?.(star)}
        className={`text-[#f59e0b] ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-105'}`}
      >
        <Star size={21} className={star <= value ? 'fill-[#f59e0b]' : 'fill-transparent'} />
      </button>
    ))}
    <span className="ml-2 text-[13px] font-semibold text-text-dark">{value}/5</span>
  </div>
);

export default MotherBookings;
