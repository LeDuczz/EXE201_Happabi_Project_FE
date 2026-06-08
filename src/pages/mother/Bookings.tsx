import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock,
  CreditCard,
  Image as ImageIcon,
  Loader2,
  MapPin,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import bookingService, { type BookingDraft } from '../../api/bookingService';
import workSessionApi from '../../api/workSessionApi';
import Btn from '../../components/common/Btn';
import Card from '../../components/common/Card';
import Topbar from '../../components/layout/Topbar';
import { getApiErrorMessage } from '../../utils/apiError';
import type { WorkSession, WorkSessionStatus } from '../../types/workSession';

interface BookingLocationState {
  nurseProfileId?: string;
  nurseName?: string;
  serviceOfferingId?: string;
  serviceName?: string;
  grossAmount?: number;
}

const statusText: Record<WorkSessionStatus, string> = {
  SCHEDULED: 'Sắp diễn ra',
  IN_PROGRESS: 'Nurse đang làm',
  PENDING_MOTHER_CONFIRMATION: 'Chờ mẹ xác nhận',
  COMPLETED: 'Hoàn thành',
  AUTO_CONFIRMED: 'Tự xác nhận',
  REPORTED: 'Đã báo cáo',
  CANCELLED: 'Đã hủy',
};

const formatCurrency = (value?: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value ?? 0);

const formatDateTime = (value?: string) => {
  if (!value) return 'Chưa có';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
};

const toDateTimeLocalValue = (date: Date) => {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
};

const minimumStartAt = () => {
  const date = new Date();
  date.setHours(date.getHours() + 2, 0, 0, 0);
  return toDateTimeLocalValue(date);
};

const progressOf = (session: WorkSession) => {
  if (!session.checklistItems.length) return 0;
  const done = session.checklistItems.filter((item) => item.status === 'COMPLETED').length;
  return Math.round((done / session.checklistItems.length) * 100);
};

const MotherBookings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const selected = (location.state ?? {}) as BookingLocationState;

  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionActionId, setSessionActionId] = useState<string | null>(null);

  const [startAt, setStartAt] = useState(minimumStartAt);
  const [serviceAddress, setServiceAddress] = useState('');
  const [motherNote, setMotherNote] = useState('');
  const [draft, setDraft] = useState<BookingDraft | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasSelectedService = Boolean(selected.nurseProfileId && selected.serviceOfferingId);

  const loadSessions = async () => {
    setSessionsLoading(true);
    setError('');
    try {
      setSessions(await workSessionApi.getMotherSessions());
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    void loadSessions();
  }, []);

  const expandedSession = useMemo(
    () => sessions.find((session) => session.id === expandedSessionId) ?? sessions[0] ?? null,
    [sessions, expandedSessionId],
  );

  useEffect(() => {
    if (!expandedSessionId && sessions.length > 0) {
      setExpandedSessionId(sessions[0].id);
    }
  }, [sessions, expandedSessionId]);

  const canCreateDraft = Boolean(
    selected.nurseProfileId &&
    selected.serviceOfferingId &&
    startAt &&
    serviceAddress.trim(),
  );

  const createDraft = async () => {
    if (!canCreateDraft || !selected.nurseProfileId || !selected.serviceOfferingId) return;
    setIsSubmitting(true);
    setError('');
    try {
      const response = await bookingService.createDraft({
        nurseProfileId: selected.nurseProfileId,
        serviceOfferingId: selected.serviceOfferingId,
        startAt: new Date(startAt).toISOString(),
        serviceAddress: serviceAddress.trim(),
        motherNote: motherNote.trim() || undefined,
      });
      setDraft(response);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const runSessionAction = async (id: string, action: () => Promise<WorkSession>) => {
    setSessionActionId(id);
    setError('');
    try {
      const updated = await action();
      setSessions((current) => current.map((session) => (session.id === updated.id ? updated : session)));
      setExpandedSessionId(updated.id);
      setReportReason('');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSessionActionId(null);
    }
  };

  return (
    <div className="pb-10">
      <Topbar
        title="Đơn và ca chăm sóc"
        subtitle="Theo dõi nurse check-in, checklist có ảnh xác thực và xác nhận hoàn thành ca."
      />

      {error && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-bold text-red-700">
          {error}
        </div>
      )}

      <div className="mb-8 grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-[22px] font-black text-text-dark">Ca chăm sóc của tôi</h2>
              <p className="mt-1 text-[13px] font-bold text-text-mid">Dữ liệu từ booking đã được xác nhận.</p>
            </div>
            <button
              type="button"
              onClick={loadSessions}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-lav-100 text-lav-dark"
            >
              <RefreshCw size={17} className={sessionsLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          {sessionsLoading ? (
            <div className="flex h-[260px] items-center justify-center">
              <Loader2 className="animate-spin text-lav-dark" size={30} />
            </div>
          ) : sessions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-lav-200 bg-lav-50 p-5 text-center text-[13px] font-bold text-text-mid">
              Chưa có ca chăm sóc nào. Sau khi thanh toán booking thành công, ca sẽ xuất hiện tại đây.
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => setExpandedSessionId(session.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    expandedSession?.id === session.id
                      ? 'border-lav-300 bg-lav-50'
                      : 'border-lav-100 bg-white hover:bg-lav-50'
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="truncate text-[14px] font-black text-text-dark">{session.serviceName}</div>
                    <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-lav-dark">
                      {statusText[session.status]}
                    </span>
                  </div>
                  <div className="text-[12px] font-bold text-text-mid">{session.nurseName}</div>
                  <div className="mt-2 text-[12px] font-bold text-text-light">{formatDateTime(session.scheduledStartAt)}</div>
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card>
          {!expandedSession ? (
            <div className="flex h-full min-h-[360px] flex-col items-center justify-center text-center">
              <CalendarClock size={52} className="mb-4 text-lav-dark opacity-25" />
              <h3 className="font-serif text-2xl font-black text-text-dark">Chưa chọn ca</h3>
              <p className="mt-2 text-sm font-bold text-text-mid">Chọn một ca bên trái để xem tiến độ.</p>
            </div>
          ) : (
            <div>
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-serif text-[24px] font-black text-text-dark">{expandedSession.serviceName}</h2>
                  <p className="mt-1 text-[13px] font-bold text-text-mid">
                    Nurse: {expandedSession.nurseName} · {formatDateTime(expandedSession.scheduledStartAt)}
                  </p>
                </div>
                <span className="rounded-full border border-lav-200 bg-lav-50 px-3 py-1 text-[11px] font-black text-lav-dark">
                  {statusText[expandedSession.status]}
                </span>
              </div>

              <div className="mb-5 grid gap-3 md:grid-cols-4">
                <Metric label="Tiến độ" value={`${progressOf(expandedSession)}%`} />
                <Metric label="Check-in" value={formatDateTime(expandedSession.checkedInAt)} />
                <Metric label="Trễ" value={`${expandedSession.lateMinutes ?? 0} phút`} />
                <Metric label="Auto confirm" value={formatDateTime(expandedSession.autoConfirmAt)} />
              </div>

              {expandedSession.checkInEvidences.length > 0 && (
                <div className="mb-5 rounded-2xl border border-lav-100 bg-lav-50 p-4">
                  <div className="mb-3 text-[13px] font-black text-text-dark">Ảnh check-in</div>
                  <EvidenceGrid evidences={expandedSession.checkInEvidences} />
                </div>
              )}

              <div className="space-y-3">
                {expandedSession.checklistItems.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-lav-100 bg-white p-4">
                    <div className="mb-3 flex items-start gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        item.status === 'COMPLETED' ? 'bg-green-500 text-white' : 'bg-lav-100 text-lav-dark'
                      }`}>
                        {item.status === 'COMPLETED' ? <CheckCircle2 size={16} /> : item.sortOrder}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[14px] font-black text-text-dark">{item.title}</div>
                        {item.note && <div className="mt-1 text-[12px] font-bold text-text-mid">{item.note}</div>}
                      </div>
                    </div>
                    {item.evidences.length > 0 && <EvidenceGrid evidences={item.evidences} />}
                  </div>
                ))}
              </div>

              {expandedSession.status === 'PENDING_MOTHER_CONFIRMATION' && (
                <div className="mt-6 rounded-2xl border border-lav-200 bg-lav-50 p-4">
                  <div className="mb-3 text-[13px] font-black text-text-dark">Xác nhận hoàn thành</div>
                  <div className="flex flex-wrap gap-3">
                    <Btn
                      disabled={sessionActionId === 'confirm'}
                      onClick={() => runSessionAction('confirm', () => workSessionApi.confirmByMother(expandedSession.id))}
                    >
                      {sessionActionId === 'confirm' ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                      Xác nhận hoàn thành
                    </Btn>
                  </div>

                  <div className="mt-4 grid gap-3">
                    <textarea
                      value={reportReason}
                      onChange={(event) => setReportReason(event.target.value)}
                      rows={3}
                      placeholder="Nhập lý do nếu ca có vấn đề..."
                      className="w-full resize-none rounded-2xl border border-lav-200 bg-white px-4 py-3 text-[13px] font-bold text-text-dark outline-none focus:border-lav-400"
                    />
                    <div>
                      <Btn
                        variant="danger"
                        disabled={!reportReason.trim() || sessionActionId === 'report'}
                        onClick={() => runSessionAction('report', () => workSessionApi.reportByMother(expandedSession.id, reportReason))}
                      >
                        {sessionActionId === 'report' ? <Loader2 className="animate-spin" size={16} /> : <XCircle size={16} />}
                        Báo cáo vấn đề
                      </Btn>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-lav-100 text-lav-dark">
            <CalendarClock size={20} />
          </div>
          <div>
            <h2 className="font-serif text-[24px] font-black text-text-dark">Đặt lịch chăm sóc</h2>
            <p className="text-[13px] font-bold text-text-mid">
              Nếu bạn vừa chọn nurse từ hồ sơ, thông tin dịch vụ sẽ được điền ở đây.
            </p>
          </div>
        </div>

        {!hasSelectedService ? (
          <div className="rounded-2xl border border-dashed border-lav-200 bg-lav-50 p-6 text-center">
            <CalendarClock className="mx-auto text-lav-dark" size={34} />
            <h3 className="mt-3 font-serif text-[22px] font-black text-text-dark">Chưa chọn nurse và dịch vụ</h3>
            <p className="mx-auto mt-2 max-w-[520px] text-[14px] font-bold leading-6 text-text-mid">
              Vui lòng chọn một nurse trong danh sách, sau đó chọn dịch vụ hoặc gói chăm sóc.
            </p>
            <Btn className="mt-5" onClick={() => navigate('/mother/search')}>
              Tìm nurse
            </Btn>
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
            <div>
              <button
                type="button"
                onClick={() => navigate('/mother/search')}
                className="mb-5 inline-flex items-center gap-2 text-[13px] font-black text-lav-dark"
              >
                <ArrowLeft size={16} />
                Chọn nurse khác
              </button>

              {draft && (
                <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-[13px] font-bold text-green-700">
                  Đã giữ lịch thành công. Vui lòng hoàn tất thanh toán trước {new Date(draft.holdExpiresAt).toLocaleTimeString('vi-VN')}.
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-[13px] font-black text-text-dark">
                    <Clock size={15} />
                    Thời gian bắt đầu
                  </span>
                  <input
                    type="datetime-local"
                    value={startAt}
                    min={minimumStartAt()}
                    onChange={(event) => setStartAt(event.target.value)}
                    disabled={Boolean(draft)}
                    className="w-full rounded-2xl border border-lav-200 bg-white px-4 py-3 text-[14px] font-bold text-text-dark outline-none transition focus:border-lav-400"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-2 flex items-center gap-2 text-[13px] font-black text-text-dark">
                    <MapPin size={15} />
                    Địa chỉ chăm sóc
                  </span>
                  <input
                    value={serviceAddress}
                    onChange={(event) => setServiceAddress(event.target.value)}
                    disabled={Boolean(draft)}
                    placeholder="Ví dụ: 12 Nguyễn Huệ, Quận 1, TP.HCM"
                    className="w-full rounded-2xl border border-lav-200 bg-white px-4 py-3 text-[14px] font-bold text-text-dark outline-none transition focus:border-lav-400"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-2 text-[13px] font-black text-text-dark">Ghi chú cho nurse</span>
                  <textarea
                    value={motherNote}
                    onChange={(event) => setMotherNote(event.target.value)}
                    disabled={Boolean(draft)}
                    rows={4}
                    placeholder="Nhu cầu chăm sóc, tình trạng mẹ/bé, giờ vào nhà..."
                    className="w-full resize-none rounded-2xl border border-lav-200 bg-white px-4 py-3 text-[14px] font-bold text-text-dark outline-none transition focus:border-lav-400"
                  />
                </label>
              </div>

              <div className="mt-6 flex justify-end">
                {!draft ? (
                  <Btn disabled={!canCreateDraft || isSubmitting} onClick={createDraft}>
                    <ShieldCheck size={16} />
                    {isSubmitting ? 'Đang giữ lịch...' : 'Giữ lịch 15 phút'}
                  </Btn>
                ) : (
                  <Btn>
                    <CreditCard size={16} />
                    Chờ nối thanh toán
                  </Btn>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-pink-100 bg-pink-50 p-5">
              <p className="text-[12px] font-bold text-text-light">Nurse</p>
              <p className="mt-1 text-[17px] font-black text-text-dark">{selected.nurseName || 'Nurse Happabi'}</p>
              <p className="mt-4 text-[12px] font-bold text-text-light">Dịch vụ</p>
              <p className="mt-1 text-[17px] font-black text-text-dark">{selected.serviceName}</p>
              <p className="mt-4 text-[12px] font-bold text-text-light">Tổng tiền</p>
              <p className="mt-1 text-[30px] font-black text-grad">{formatCurrency(selected.grossAmount)}</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-lav-100 bg-lav-50 p-4">
    <div className="text-[11px] font-black uppercase text-text-light">{label}</div>
    <div className="mt-1 text-[13px] font-black text-text-dark">{value}</div>
  </div>
);

const EvidenceGrid = ({ evidences }: { evidences: Array<{ id: string; previewUrl?: string }> }) => (
  <div className="flex flex-wrap gap-3">
    {evidences.map((evidence) => (
      <a
        key={evidence.id}
        href={evidence.previewUrl}
        target="_blank"
        rel="noreferrer"
        className="flex h-20 w-24 items-center justify-center overflow-hidden rounded-2xl border border-lav-100 bg-lav-50 text-lav-dark"
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

export default MotherBookings;
