import { CalendarDays, CheckCircle2, ClipboardCheck, Clock, HeartPulse, Loader2, Star, Wallet, type LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMotherDashboard, type MotherDashboard } from '../api/motherDashboardApi';
import Avatar from '../components/common/Avatar';
import Btn from '../components/common/Btn';
import Card from '../components/common/Card';
import Topbar from '../components/layout/Topbar';
import { useAuth } from '../contexts/AuthContext';
import { useNurseDashboard } from '../hooks/useNurseDashboard';
import type { WorkSessionStatus } from '../types/workSession';
import { getApiErrorMessage } from '../utils/apiError';

const nurseStatusLabel: Record<WorkSessionStatus, string> = {
  SCHEDULED: 'Sắp tới',
  IN_PROGRESS: 'Đang làm',
  PENDING_MOTHER_CONFIRMATION: 'Chờ xác nhận',
  COMPLETED: 'Hoàn thành',
  AUTO_CONFIRMED: 'Tự xác nhận',
  REPORTED: 'Có báo cáo',
  CANCELLED: 'Đã hủy',
};

const formatTime = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));

const formatRevenue = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}tr`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(value);
};

const NurseHome = () => {
  const navigate = useNavigate();
  const { dashboard, isLoading, error } = useNurseDashboard();

  return (
    <>
      <Topbar title="Trang chủ" subtitle="Quản lý lịch làm, checklist và thu nhập hôm nay." />

      {error && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-bold text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        {[
          [CalendarDays, String(dashboard?.todaySessionCount ?? 0), 'Ca hôm nay'],
          [ClipboardCheck, `${dashboard?.checklistCompletionPercent ?? 0}%`, 'Checklist xong'],
          [Wallet, formatRevenue(dashboard?.todayRevenue ?? 0), 'Doanh thu ngày'],
          [Star, String(dashboard?.ratingAvg ?? '0.0'), 'Đánh giá'],
        ].map(([Icon, value, label]) => (
          <Card key={String(label)} className="p-5 text-center">
            <Icon className="mx-auto mb-2 text-lav-dark" size={24} />
            <div className="text-heading text-3xl font-semibold text-grad">
              {isLoading ? <Loader2 className="mx-auto animate-spin" size={28} /> : String(value)}
            </div>
            <div className="mt-1 text-xs font-bold text-text-light">{String(label)}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-heading text-xl font-semibold">Lịch làm hôm nay</h3>
            <Btn variant="ghost" size="sm" onClick={() => navigate('/nurse/bookings')}>Xem tất cả</Btn>
          </div>
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="animate-spin text-lav-dark" size={30} />
            </div>
          ) : (dashboard?.todaySessions.length ?? 0) === 0 ? (
            <p className="py-8 text-center text-sm font-bold text-text-mid">Chưa có ca làm hôm nay.</p>
          ) : (
            dashboard?.todaySessions.map((item) => (
              <div
                key={item.id}
                className="flex cursor-pointer gap-3 border-b border-lav-200 py-4 last:border-b-0"
                onClick={() => navigate(`/nurse/work-sessions/${item.id}`)}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-lav-100 text-lav-dark">
                  <Clock size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{item.motherName}</span>
                    <span className="rounded-full bg-lav-100 px-3 py-1 text-[11px] font-semibold text-lav-dark">
                      {nurseStatusLabel[item.status]}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-text-light">{item.serviceName}</div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs font-bold text-text-light">
                    <span>{formatTime(item.scheduledStartAt)}</span>
                    <span>{item.serviceAddress || 'Địa chỉ sẽ cập nhật sau'}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </Card>

        <Card>
          <h3 className="text-heading text-xl font-semibold">Checklist nhanh</h3>
          <div className="mt-4 space-y-3">
            {(dashboard?.activeChecklistPreview.length
              ? dashboard.activeChecklistPreview
              : ['Chưa có bước checklist đang mở']
            ).map((item, index) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-lav-100 bg-[#fff9fb] p-3">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full ${
                  dashboard?.activeChecklistPreview.length && index < 2
                    ? 'bg-verified-bg text-verified'
                    : 'bg-lav-100 text-lav-dark'
                }`}>
                  <CheckCircle2 size={16} />
                </div>
                <span className="text-sm font-bold text-text-mid">{item}</span>
              </div>
            ))}
          </div>
          <Btn full className="mt-4" onClick={() => navigate('/nurse/bookings')}>Vào ca làm</Btn>
        </Card>
      </div>
    </>
  );
};
const specialtyLabel: Record<string, string> = {
  NURSE: 'Điều dưỡng',
  MIDWIFE: 'Hộ sinh',
  CAREGIVER: 'Chăm sóc sau sinh',
};

const getInitials = (name?: string) => {
  if (!name) return 'HB';
  const parts = name.trim().split(/\s+/);
  return parts.length > 1
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();
};

const formatSessionTime = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
}).format(new Date(value));

const MotherHome = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<MotherDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await getMotherDashboard();
        if (!cancelled) setDashboard(response);
      } catch (requestError) {
        if (!cancelled) setError(getApiErrorMessage(requestError, 'Không thể tải dữ liệu trang chủ. Vui lòng thử lại.'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = dashboard?.metrics;
  const recommendedNurses = dashboard?.recommendedNurses ?? [];
  const upcomingSessions = dashboard?.upcomingSessions ?? [];
  const metricCards: Array<{ Icon: LucideIcon; value: string | number; label: string }> = [
    { Icon: CalendarDays, value: metrics?.upcomingSessions ?? 0, label: 'Lịch sắp tới' },
    { Icon: CheckCircle2, value: metrics?.completedSessions ?? 0, label: 'Ca hoàn thành' },
    { Icon: Star, value: metrics?.averageRatingGiven == null ? '—' : Number(metrics.averageRatingGiven).toFixed(1), label: 'Đánh giá đã gửi' },
    { Icon: HeartPulse, value: metrics?.paidBookings ?? 0, label: 'Lần đã đặt' },
  ];

  return (
    <>
      <Topbar title="Trang chủ" subtitle="Theo dõi lịch chăm sóc và tìm điều dưỡng phù hợp cho mẹ và bé." />

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-danger-bg px-4 py-3 text-sm font-bold text-danger">
          {error}
        </div>
      )}

      <section className="relative mb-6 overflow-hidden rounded-[28px] bg-grad p-7 shadow-lg">
        <div className="absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/10" />
        <div className="relative z-10 max-w-2xl">
          <div className="mb-2 text-overline text-white/75">Gợi ý điều dưỡng</div>
          <h2 className="text-heading text-3xl font-semibold leading-tight text-white">
            {isLoading
              ? 'Đang tìm điều dưỡng phù hợp cho bạn'
              : recommendedNurses.length
                ? `${recommendedNurses.length} điều dưỡng đang sẵn sàng nhận lịch`
                : 'Chưa có điều dưỡng phù hợp tại thời điểm này'}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/72">
            {dashboard?.profileLocationConfigured
              ? 'Gợi ý dựa trên khu vực hồ sơ, trạng thái hoạt động và khung thời gian nhận lịch của điều dưỡng.'
              : 'Hoàn thiện thành phố trong hồ sơ để nhận gợi ý phù hợp hơn với khu vực của bạn.'}
          </p>
          <Btn variant="outline" size="sm" className="mt-5 border-white/45 bg-white/15 text-white backdrop-blur" onClick={() => navigate('/mother/search')}>
            Tìm điều dưỡng
          </Btn>
        </div>
      </section>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        {metricCards.map(({ Icon, value, label }) => (
          <Card key={label} className="p-5 text-center">
            <Icon className="mx-auto mb-2 text-lav-dark" size={24} />
            <div className="text-heading text-3xl font-semibold text-grad">
              {isLoading ? <Loader2 className="mx-auto animate-spin" size={28} /> : value}
            </div>
            <div className="mt-1 text-xs font-bold text-text-light">{label}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-heading text-xl font-semibold">Lịch hẹn sắp tới</h3>
            <Btn variant="ghost" size="sm" onClick={() => navigate('/mother/bookings')}>Xem tất cả</Btn>
          </div>
          {isLoading ? (
            <div className="flex h-40 items-center justify-center"><Loader2 className="animate-spin text-lav-dark" size={30} /></div>
          ) : upcomingSessions.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm font-bold text-text-mid">Bạn chưa có lịch hẹn sắp tới.</p>
              <Btn size="sm" className="mt-4" onClick={() => navigate('/mother/search')}>Đặt lịch mới</Btn>
            </div>
          ) : (
            <>
              {upcomingSessions.map((session) => (
                <button
                  key={session.workSessionId}
                  type="button"
                  onClick={() => navigate('/mother/bookings')}
                  className="flex w-full items-center gap-3 border-b border-lav-200 py-4 text-left last:border-b-0"
                >
                  <Avatar initials={getInitials(session.nurseName)} src={session.nurseAvatarUrl || undefined} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{session.nurseName}</div>
                    <div className="truncate text-sm text-text-light">{session.serviceName}</div>
                    <div className="mt-1 text-xs font-bold text-text-light">{formatSessionTime(session.scheduledStartAt)}</div>
                  </div>
                  <div className="text-sm font-semibold text-lav-dark">Sắp tới</div>
                </button>
              ))}
              <Btn full className="mt-4" onClick={() => navigate('/mother/search')}>Đặt lịch mới</Btn>
            </>
          )}
        </Card>

        <Card>
          <h3 className="text-heading text-xl font-semibold">Điều dưỡng phù hợp</h3>
          <p className="mt-1 text-xs font-bold text-text-light">Đang hoạt động và có khung nhận lịch hợp lệ</p>
          {isLoading ? (
            <div className="flex h-40 items-center justify-center"><Loader2 className="animate-spin text-lav-dark" size={30} /></div>
          ) : recommendedNurses.length === 0 ? (
            <div className="py-8 text-center text-sm font-bold text-text-mid">Chưa có điều dưỡng phù hợp.</div>
          ) : (
            <div className="mt-4">
              {recommendedNurses.map((nurse) => (
                <div key={nurse.nurseProfileId} className="flex items-center gap-3 border-b border-lav-200 py-3 last:border-b-0">
                  <Avatar initials={getInitials(nurse.fullName)} src={nurse.avatarUrl || undefined} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{nurse.fullName}</div>
                    <div className="truncate text-xs text-text-light">{specialtyLabel[nurse.specialty || ''] || 'Điều dưỡng'}</div>
                    <div className="mt-1 flex items-center gap-2 text-xs font-bold text-text-light">
                      <Star size={12} className="fill-[#f59e0b] text-[#f59e0b]" />
                      {Number(nurse.ratingAvg ?? 0).toFixed(1)}
                      <span>{nurse.totalReviews ?? 0} đánh giá</span>
                    </div>
                  </div>
                  <Btn size="xs" onClick={() => navigate(`/mother/nurses/${nurse.nurseProfileId}`)}>Xem</Btn>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
};

const Home = () => {
  const { primaryRole } = useAuth();
  return primaryRole === 'NURSE' ? <NurseHome /> : <MotherHome />;
};

export default Home;
