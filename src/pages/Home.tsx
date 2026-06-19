import { CalendarDays, CheckCircle2, ClipboardCheck, Clock, HeartPulse, Loader2, MapPin, Star, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/common/Avatar';
import Btn from '../components/common/Btn';
import Card from '../components/common/Card';
import Topbar from '../components/layout/Topbar';
import { useAuth } from '../contexts/AuthContext';
import { useNurseDashboard } from '../hooks/useNurseDashboard';
import type { WorkSessionStatus } from '../types/workSession';

const suggestedNurses = [
  { name: 'Nguyễn Thị Lan Anh', title: 'Điều dưỡng trưởng', avatar: 'LA', rating: 4.97, distance: '1.2km', price: '350k' },
  { name: 'Trần Minh Châu', title: 'Nữ hộ sinh cao cấp', avatar: 'MC', rating: 4.95, distance: '2.1km', price: '420k' },
  { name: 'Võ Thị Mỹ Linh', title: 'Chuyên gia hậu sản', avatar: 'ML', rating: 4.99, distance: '4.1km', price: '520k' },
];

const bookings = [
  { nurse: 'Trần Minh Châu', service: 'Hỗ trợ cho con bú', date: '14/05/2026', time: '10:00', avatar: 'MC', price: '420.000đ' },
  { nurse: 'Võ Thị Mỹ Linh', service: 'Phục hồi toàn diện', date: '20/05/2026', time: '09:00', avatar: 'ML', price: '520.000đ' },
];

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
const MotherHome = () => {
  const navigate = useNavigate();

  return (
    <>
      <Topbar title="Trang chủ" subtitle="Hôm nay mẹ và bé thế nào rồi?" />

      <section className="relative mb-6 overflow-hidden rounded-[28px] bg-grad p-7 shadow-lg">
        <div className="absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/10" />
        <div className="relative z-10 max-w-2xl">
          <div className="mb-2 text-overline text-white/75">AI gợi ý hôm nay</div>
          <h2 className="text-heading text-3xl font-semibold leading-tight text-white">
            3 điều dưỡng phù hợp nhất trong khu vực của bạn
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/72">
            Dựa trên vị trí, nhu cầu chăm sóc sau sinh và lịch trống của điều dưỡng.
          </p>
          <Btn variant="outline" size="sm" className="mt-5 border-white/45 bg-white/15 text-white backdrop-blur" onClick={() => navigate('/mother/search')}>
            Tìm điều dưỡng ngay
          </Btn>
        </div>
      </section>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        {[
          [CalendarDays, '2', 'Lịch sắp tới'],
          [CheckCircle2, '4', 'Ca hoàn thành'],
          [Star, '4.95', 'Rating trung bình'],
          [HeartPulse, '3', 'Lần đặt lịch'],
        ].map(([Icon, value, label]) => (
          <Card key={String(label)} className="p-5 text-center">
            <Icon className="mx-auto mb-2 text-lav-dark" size={24} />
            <div className="text-heading text-3xl font-semibold text-grad">{String(value)}</div>
            <div className="mt-1 text-xs font-bold text-text-light">{String(label)}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-heading text-xl font-semibold">Lịch hẹn sắp tới</h3>
            <Btn variant="ghost" size="sm" onClick={() => navigate('/mother/bookings')}>Xem tất cả</Btn>
          </div>
          {bookings.map((booking) => (
            <div key={`${booking.nurse}-${booking.time}`} className="flex items-center gap-3 border-b border-lav-200 py-4 last:border-b-0">
              <Avatar initials={booking.avatar} size={44} />
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{booking.nurse}</div>
                <div className="text-sm text-text-light">{booking.service}</div>
                <div className="mt-1 text-xs font-bold text-text-light">{booking.date} · {booking.time}</div>
              </div>
              <div className="text-right text-sm font-semibold text-lav-dark">{booking.price}</div>
            </div>
          ))}
          <Btn full className="mt-4" onClick={() => navigate('/mother/search')}>Đặt lịch mới</Btn>
        </Card>

        <Card>
          <h3 className="text-heading text-xl font-semibold">AI gợi ý cho bạn</h3>
          <p className="mt-1 text-xs font-bold text-text-light">Dựa trên vị trí và nhu cầu chăm sóc</p>
          <div className="mt-4">
            {suggestedNurses.map((nurse) => (
              <div key={nurse.name} className="flex items-center gap-3 border-b border-lav-200 py-3 last:border-b-0">
                <Avatar initials={nurse.avatar} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{nurse.name}</div>
                  <div className="truncate text-xs text-text-light">{nurse.title}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs font-bold text-text-light">
                    <Star size={12} className="fill-[#f59e0b] text-[#f59e0b]" /> {nurse.rating}
                    <MapPin size={12} /> {nurse.distance}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-lav-dark">{nurse.price}</div>
                  <Btn size="xs" onClick={() => navigate('/mother/search')}>Đặt</Btn>
                </div>
              </div>
            ))}
          </div>
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
