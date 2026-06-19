import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Phone,
  RotateCcw,
  Send,
  ShieldCheck,
  Upload,
  XCircle,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../../components/common/Card';
import Btn from '../../components/common/Btn';
import Topbar from '../../components/layout/Topbar';
import bookingService from '../../api/bookingService';
import workSessionApi from '../../api/workSessionApi';
import type { WorkSession, WorkSessionChecklistItem } from '../../types/workSession';
import { getApiErrorMessage } from '../../utils/apiError';

const formatDateTime = (value?: string) => {
  if (!value) return 'Chưa có';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
};

const statusText: Record<WorkSession['status'], string> = {
  SCHEDULED: 'Sắp làm',
  IN_PROGRESS: 'Đang làm',
  PENDING_MOTHER_CONFIRMATION: 'Chờ mẹ xác nhận',
  COMPLETED: 'Hoàn thành',
  AUTO_CONFIRMED: 'Tự xác nhận',
  REPORTED: 'Có báo cáo',
  CANCELLED: 'Đã hủy',
};

const canEdit = (session?: WorkSession | null) => session?.status === 'IN_PROGRESS';

const NurseChecklist = () => {
  const { workSessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<WorkSession | null>(null);
  const [checkInFiles, setCheckInFiles] = useState<File[]>([]);
  const [itemFiles, setItemFiles] = useState<Record<string, File[]>>({});
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});
  const [cancelReason, setCancelReason] = useState('');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [incidentFiles, setIncidentFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadSession = async () => {
    if (!workSessionId) return;
    setIsLoading(true);
    setError('');
    try {
      setSession(await workSessionApi.getNurseSession(workSessionId));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSession();
  }, [workSessionId]);

  const completedCount = useMemo(
    () => session?.checklistItems.filter((item) => item.status === 'COMPLETED').length ?? 0,
    [session],
  );

  const progress = useMemo(() => {
    if (!session?.checklistItems.length) return 0;
    return Math.round((completedCount / session.checklistItems.length) * 100);
  }, [completedCount, session]);

  const runAction = async (id: string, action: () => Promise<WorkSession>) => {
    setActionId(id);
    setError('');
    try {
      const next = await action();
      setSession(next);
      return next;
    } catch (err) {
      setError(getApiErrorMessage(err));
      return null;
    } finally {
      setActionId(null);
    }
  };

  const handleCheckIn = async () => {
    if (!session || checkInFiles.length === 0) return;
    const next = await runAction('check-in', () => workSessionApi.checkIn(session.id, checkInFiles));
    if (next) setCheckInFiles([]);
  };

  const handleComplete = async (item: WorkSessionChecklistItem) => {
    if (!session) return;
    const files = itemFiles[item.id] ?? [];
    const next = await runAction(item.id, () =>
      workSessionApi.completeChecklistItem(session.id, item.id, files, itemNotes[item.id]),
    );
    if (next) {
      setItemFiles((current) => ({ ...current, [item.id]: [] }));
      setItemNotes((current) => ({ ...current, [item.id]: '' }));
    }
  };

  const handleUndo = async (item: WorkSessionChecklistItem) => {
    if (!session) return;
    await runAction(`undo-${item.id}`, () => workSessionApi.undoChecklistItem(session.id, item.id));
  };

  const handleCheckout = async () => {
    if (!session) return;
    await runAction('checkout', () => workSessionApi.checkout(session.id));
  };

  const handleCancelBooking = async () => {
    if (!session || !cancelReason.trim()) return;
    setActionId('cancel-booking');
    setError('');
    try {
      await bookingService.cancelByNurse(session.bookingId, cancelReason.trim());
      await loadSession();
      setCancelReason('');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setActionId(null);
    }
  };

  const handleReportMotherUnreachable = async () => {
    if (!session || !incidentDescription.trim() || incidentFiles.length === 0) return;
    setActionId('mother-unreachable');
    setError('');
    try {
      await workSessionApi.reportMotherUnreachable(session.id, incidentDescription.trim(), incidentFiles);
      await loadSession();
      setIncidentDescription('');
      setIncidentFiles([]);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setActionId(null);
    }
  };

  const allDone = session?.checklistItems.every((item) => item.status === 'COMPLETED') ?? false;
  const locked = session ? !['SCHEDULED', 'IN_PROGRESS'].includes(session.status) : false;

  if (!workSessionId) {
    return (
      <div>
        <Topbar title="Checklist ca làm" subtitle="Chọn một ca làm từ danh sách lịch để bắt đầu." />
        <Card className="text-center">
          <p className="text-sm font-bold text-text-mid">Bạn chưa chọn ca làm.</p>
          <Btn className="mt-4" onClick={() => navigate('/nurse/bookings')}>
            Về lịch ca
          </Btn>
        </Card>
      </div>
    );
  }

  return (
    <div className="pb-10">
      <Topbar title="Checklist ca làm" subtitle="Mỗi bước cần ảnh xác thực. Sau checkout, ca sẽ bị khóa thao tác." />

      <button
        type="button"
        onClick={() => navigate('/nurse/bookings')}
        className="mb-5 inline-flex items-center gap-2 text-[13px] font-black text-lav-dark"
      >
        <ArrowLeft size={16} />
        Quay lại lịch ca
      </button>

      {error && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-bold text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <Card className="flex h-[420px] items-center justify-center">
          <Loader2 className="animate-spin text-lav-dark" size={34} />
        </Card>
      ) : !session ? (
        <Card className="text-center">
          <p className="text-sm font-bold text-text-mid">Không tìm thấy ca làm.</p>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-5">
            <Card>
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-serif text-[24px] font-black text-text-dark">{session.serviceName}</h2>
                  <p className="mt-1 text-[13px] font-bold text-text-mid">
                    Mẹ: {session.motherName} · Bắt đầu: {formatDateTime(session.scheduledStartAt)}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-lav-200 bg-lav-50 px-3 py-1 text-[11px] font-black text-lav-dark">
                  {statusText[session.status]}
                </span>
              </div>

              <div className="mb-5 grid gap-3 md:grid-cols-2">
                <Metric icon={<Phone size={16} />} label="Số điện thoại mẹ" value={session.motherPhone || 'Chưa có'} />
                <Metric icon={<MapPin size={16} />} label="Địa chỉ chăm sóc" value={session.serviceAddress || 'Chưa có'} />
              </div>

              {session.status === 'SCHEDULED' ? (
                <div className="rounded-[18px] border border-dashed border-lav-300 bg-lav-50 p-5">
                  <div className="mb-3 flex items-center gap-2 text-[13px] font-black text-text-dark">
                    <Camera size={17} />
                    Ảnh check-in
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/png,image/jpeg"
                    onChange={(event) => setCheckInFiles(Array.from(event.target.files ?? []))}
                    className="block w-full cursor-pointer rounded-2xl border border-lav-200 bg-white px-4 py-3 text-[13px] font-bold text-text-mid file:mr-3 file:rounded-xl file:border-0 file:bg-lav-100 file:px-3 file:py-2 file:text-lav-dark"
                  />
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <p className="text-[12px] font-bold text-text-mid">
                      Đã chọn {checkInFiles.length} ảnh. Check-in sau giờ bắt đầu sẽ được ghi nhận trễ.
                    </p>
                    <Btn disabled={!checkInFiles.length || actionId === 'check-in'} onClick={handleCheckIn}>
                      {actionId === 'check-in' ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                      Check-in
                    </Btn>
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-3">
                  <Metric icon={<Clock size={16} />} label="Check-in" value={formatDateTime(session.checkedInAt)} />
                  <Metric label="Trễ" value={`${session.lateMinutes ?? 0} phút`} />
                  <Metric label="Ảnh check-in" value={`${session.checkInEvidences.length} ảnh`} />
                </div>
              )}
            </Card>

            {session.checklistItems.map((item) => {
              const files = itemFiles[item.id] ?? [];
              const completed = item.status === 'COMPLETED';
              return (
                <Card key={item.id} className={completed ? 'border-green-200 bg-green-50/60' : ''}>
                  <div className="flex items-start gap-4">
                    <div
                      className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-black ${
                        completed ? 'bg-green-500 text-white' : 'bg-lav-100 text-lav-dark'
                      }`}
                    >
                      {completed ? <CheckCircle2 size={18} /> : item.sortOrder}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-[16px] font-black text-text-dark">{item.title}</h3>
                          {item.completedAt && (
                            <p className="mt-1 text-[12px] font-bold text-text-mid">
                              Hoàn thành lúc {formatDateTime(item.completedAt)}
                            </p>
                          )}
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-black ${
                            completed ? 'bg-green-100 text-green-700' : 'bg-lav-50 text-text-mid'
                          }`}
                        >
                          {completed ? 'Đã xong' : 'Chờ làm'}
                        </span>
                      </div>

                      {item.evidences.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-3">
                          {item.evidences.map((evidence) => (
                            <a
                              key={evidence.id}
                              href={evidence.previewUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="group relative h-20 w-24 overflow-hidden rounded-2xl border border-lav-100 bg-white"
                            >
                              {evidence.previewUrl ? (
                                <img src={evidence.previewUrl} alt="Evidence" className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full items-center justify-center text-lav-dark">
                                  <ImageIcon size={20} />
                                </div>
                              )}
                            </a>
                          ))}
                        </div>
                      )}

                      {!completed && canEdit(session) && (
                        <div className="mt-4 grid gap-3">
                          <input
                            type="file"
                            multiple
                            accept="image/png,image/jpeg"
                            onChange={(event) =>
                              setItemFiles((current) => ({
                                ...current,
                                [item.id]: Array.from(event.target.files ?? []),
                              }))
                            }
                            className="block w-full cursor-pointer rounded-2xl border border-lav-200 bg-white px-4 py-3 text-[13px] font-bold text-text-mid file:mr-3 file:rounded-xl file:border-0 file:bg-lav-100 file:px-3 file:py-2 file:text-lav-dark"
                          />
                          <textarea
                            value={itemNotes[item.id] ?? ''}
                            onChange={(event) =>
                              setItemNotes((current) => ({ ...current, [item.id]: event.target.value }))
                            }
                            rows={3}
                            placeholder="Ghi chú ngắn cho bước này..."
                            className="w-full resize-none rounded-2xl border border-lav-200 bg-white px-4 py-3 text-[13px] font-bold text-text-dark outline-none focus:border-lav-400"
                          />
                          <div className="flex justify-end">
                            <Btn disabled={!files.length || actionId === item.id} onClick={() => handleComplete(item)}>
                              {actionId === item.id ? (
                                <Loader2 className="animate-spin" size={16} />
                              ) : (
                                <CheckCircle2 size={16} />
                              )}
                              Hoàn thành bước
                            </Btn>
                          </div>
                        </div>
                      )}

                      {completed && canEdit(session) && (
                        <div className="mt-4 flex justify-end">
                          <Btn
                            variant="soft"
                            size="sm"
                            disabled={actionId === `undo-${item.id}`}
                            onClick={() => handleUndo(item)}
                          >
                            {actionId === `undo-${item.id}` ? (
                              <Loader2 className="animate-spin" size={15} />
                            ) : (
                              <RotateCcw size={15} />
                            )}
                            Undo trước checkout
                          </Btn>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <aside className="space-y-5">
            <div className="sticky top-0 rounded-[20px] border border-lav-200 bg-white p-6 shadow-[0_4px_24px_rgba(168,85,247,0.09)]">
              <div className="mb-6">
                <div className="mb-2 flex items-end justify-between">
                  <div>
                    <div className="text-sm font-black text-text-dark">Tiến độ ca làm</div>
                    <div className="mt-1 text-xs font-bold text-text-light">
                      {completedCount}/{session.checklistItems.length} bước đã hoàn thành
                    </div>
                  </div>
                  <div className="font-serif text-[34px] font-black text-lav-dark">{progress}%</div>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-lav-100">
                  <div className="h-full rounded-full bg-grad transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="space-y-3 rounded-2xl bg-lav-50 p-4">
                <div className="flex items-center gap-3 text-xs font-bold text-text-mid">
                  <ShieldCheck size={16} className="text-green-600" />
                  Ảnh xác thực là bắt buộc trước khi tick.
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-text-mid">
                  <RotateCcw size={16} className="text-lav-dark" />
                  Undo chỉ mở trước khi checkout.
                </div>
              </div>

              {locked && (
                <div className="mt-5 rounded-2xl border border-lav-100 bg-lav-50 px-4 py-3 text-xs font-bold text-text-mid">
                  Ca đã checkout hoặc đã đóng. Không thể chỉnh checklist nữa.
                </div>
              )}

              <Btn
                full
                className="mt-6 min-h-[42px]"
                disabled={!allDone || session.status !== 'IN_PROGRESS' || actionId === 'checkout'}
                onClick={handleCheckout}
              >
                {actionId === 'checkout' ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                Checkout ca làm
              </Btn>

              {session.status === 'SCHEDULED' && (
                <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-black text-red-700">
                    <XCircle size={16} />
                    Hủy ca trước 24 giờ
                  </div>
                  <textarea
                    value={cancelReason}
                    onChange={(event) => setCancelReason(event.target.value)}
                    rows={3}
                    placeholder="Nhập lý do hủy ca..."
                    className="w-full resize-none rounded-xl border border-red-100 bg-white px-3 py-2 text-xs font-bold text-text-dark outline-none focus:border-red-300"
                  />
                  <Btn
                    full
                    variant="danger"
                    className="mt-3"
                    disabled={!cancelReason.trim() || actionId === 'cancel-booking'}
                    onClick={handleCancelBooking}
                  >
                    {actionId === 'cancel-booking' ? <Loader2 className="animate-spin" size={15} /> : <XCircle size={15} />}
                    Hủy ca
                  </Btn>
                </div>
              )}

              {['SCHEDULED', 'IN_PROGRESS'].includes(session.status) && (
                <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-black text-amber-800">
                    <AlertTriangle size={16} />
                    Báo không liên lạc được mẹ
                  </div>
                  <textarea
                    value={incidentDescription}
                    onChange={(event) => setIncidentDescription(event.target.value)}
                    rows={3}
                    placeholder="Mô tả bạn đã gọi/nhắn tin và chờ trong 15 phút..."
                    className="w-full resize-none rounded-xl border border-amber-100 bg-white px-3 py-2 text-xs font-bold text-text-dark outline-none focus:border-amber-300"
                  />
                  <input
                    type="file"
                    multiple
                    accept="image/png,image/jpeg"
                    onChange={(event) => setIncidentFiles(Array.from(event.target.files ?? []))}
                    className="mt-3 block w-full cursor-pointer rounded-xl border border-amber-100 bg-white px-3 py-2 text-xs font-bold text-text-mid file:mr-2 file:rounded-lg file:border-0 file:bg-amber-100 file:px-2 file:py-1 file:text-amber-800"
                  />
                  <Btn
                    full
                    variant="outline"
                    className="mt-3"
                    disabled={!incidentDescription.trim() || incidentFiles.length === 0 || actionId === 'mother-unreachable'}
                    onClick={handleReportMotherUnreachable}
                  >
                    {actionId === 'mother-unreachable' ? <Loader2 className="animate-spin" size={15} /> : <AlertTriangle size={15} />}
                    Gửi báo cáo sự cố
                  </Btn>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

const Metric = ({ icon, label, value }: { icon?: ReactNode; label: string; value: string }) => (
  <div className="rounded-2xl border border-lav-100 bg-white p-4">
    <div className="mb-1 flex items-center gap-2 text-[12px] font-black text-text-light">
      {icon}
      {label}
    </div>
    <div className="text-[14px] font-black text-text-dark">{value}</div>
  </div>
);

export default NurseChecklist;
