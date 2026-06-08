import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock, Loader2, MapPin, PlayCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Btn from '../../components/common/Btn';
import Avatar from '../../components/common/Avatar';
import Topbar from '../../components/layout/Topbar';
import workSessionApi from '../../api/workSessionApi';
import type { WorkSession, WorkSessionStatus } from '../../types/workSession';
import { getApiErrorMessage } from '../../utils/apiError';

const tabs: Array<{ label: string; value: 'ALL' | WorkSessionStatus }> = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Sắp làm', value: 'SCHEDULED' },
  { label: 'Đang làm', value: 'IN_PROGRESS' },
  { label: 'Chờ mẹ xác nhận', value: 'PENDING_MOTHER_CONFIRMATION' },
  { label: 'Hoàn thành', value: 'COMPLETED' },
  { label: 'Có báo cáo', value: 'REPORTED' },
];

const statusLabel: Record<WorkSessionStatus, string> = {
  SCHEDULED: 'Sắp làm',
  IN_PROGRESS: 'Đang làm',
  PENDING_MOTHER_CONFIRMATION: 'Chờ xác nhận',
  COMPLETED: 'Hoàn thành',
  AUTO_CONFIRMED: 'Tự xác nhận',
  REPORTED: 'Có báo cáo',
  CANCELLED: 'Đã hủy',
};

const statusClass: Record<WorkSessionStatus, string> = {
  SCHEDULED: 'bg-blue-50 text-blue-700 border-blue-100',
  IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-100',
  PENDING_MOTHER_CONFIRMATION: 'bg-violet-50 text-violet-700 border-violet-100',
  COMPLETED: 'bg-green-50 text-green-700 border-green-100',
  AUTO_CONFIRMED: 'bg-green-50 text-green-700 border-green-100',
  REPORTED: 'bg-red-50 text-red-700 border-red-100',
  CANCELLED: 'bg-slate-50 text-slate-500 border-slate-100',
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

const completionRate = (session: WorkSession) => {
  if (!session.checklistItems.length) return 0;
  const done = session.checklistItems.filter((item) => item.status === 'COMPLETED').length;
  return Math.round((done / session.checklistItems.length) * 100);
};

const NurseBookings = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | WorkSessionStatus>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSessions = async () => {
    setIsLoading(true);
    setError('');
    try {
      setSessions(await workSessionApi.getNurseSessions());
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSessions();
  }, []);

  const filteredSessions = useMemo(() => {
    if (activeTab === 'ALL') return sessions;
    return sessions.filter((session) => session.status === activeTab);
  }, [activeTab, sessions]);

  return (
    <div className="pb-10">
      <Topbar
        title="Lịch ca làm"
        subtitle="Theo dõi ca đã đặt, check-in đúng giờ và hoàn thành checklist có ảnh xác thực."
      />

      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={`whitespace-nowrap rounded-full px-5 py-2 text-xs font-black transition ${
                activeTab === tab.value
                  ? 'bg-lav-acc text-white shadow-[0_8px_22px_rgba(192,132,252,.25)]'
                  : 'bg-white text-lav-dark ring-1 ring-lav-200 hover:bg-lav-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Btn variant="soft" size="sm" onClick={loadSessions} disabled={isLoading}>
          <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          Làm mới
        </Btn>
      </div>

      {error && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-bold text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <Card className="flex h-[360px] items-center justify-center">
          <Loader2 className="animate-spin text-lav-dark" size={34} />
        </Card>
      ) : filteredSessions.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20 text-center">
          <CalendarDays size={58} className="mb-4 text-lav-dark opacity-25" />
          <h3 className="font-serif text-2xl font-black text-text-dark">Chưa có ca phù hợp</h3>
          <p className="mt-2 max-w-[520px] text-sm font-bold text-text-mid">
            Khi booking đã được thanh toán và xác nhận, ca làm sẽ xuất hiện tại đây.
          </p>
        </Card>
      ) : (
        <div className="grid gap-5">
          {filteredSessions.map((session) => {
            const progress = completionRate(session);
            return (
              <Card key={session.id} className="overflow-hidden p-0">
                <div className="grid grid-cols-[1fr_280px]">
                  <div className="p-6">
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar initials={session.motherName?.slice(0, 2) || 'M'} size={48} />
                        <div>
                          <div className="text-lg font-black text-text-dark">{session.motherName}</div>
                          <div className="text-[13px] font-bold text-lav-dark">{session.serviceName}</div>
                        </div>
                      </div>

                      <span className={`rounded-full border px-3 py-1 text-[11px] font-black ${statusClass[session.status]}`}>
                        {statusLabel[session.status]}
                      </span>
                    </div>

                    <div className="grid gap-4 text-[13px] font-bold text-text-mid md:grid-cols-2">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-lav-dark" />
                        {formatDateTime(session.scheduledStartAt)}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-lav-dark" />
                        Booking #{session.bookingId.slice(0, 8)}
                      </div>
                    </div>

                    {session.lateMinutes > 0 && (
                      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-bold text-amber-800">
                        Ca này đã check-in trễ {session.lateMinutes} phút.
                      </div>
                    )}
                  </div>

                  <div className="border-l border-lav-100 bg-lav-50 p-6">
                    <div className="mb-4">
                      <div className="mb-2 flex items-center justify-between text-[12px] font-black text-text-mid">
                        <span>Tiến độ checklist</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white">
                        <div className="h-full rounded-full bg-grad" style={{ width: `${progress}%` }} />
                      </div>
                    </div>

                    <div className="mb-5 text-[12px] font-bold leading-5 text-text-mid">
                      {session.checklistItems.filter((item) => item.status === 'COMPLETED').length}/
                      {session.checklistItems.length} mục đã hoàn thành
                    </div>

                    <Btn full onClick={() => navigate(`/nurse/work-sessions/${session.id}`)}>
                      <PlayCircle size={16} />
                      Vào ca
                    </Btn>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NurseBookings;
