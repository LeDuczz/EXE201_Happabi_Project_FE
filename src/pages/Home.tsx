import { CalendarDays, CheckCircle2, ClipboardCheck, Clock, HeartPulse, MapPin, Star, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/common/Avatar';
import Btn from '../components/common/Btn';
import Card from '../components/common/Card';
import Topbar from '../components/layout/Topbar';
import { useAuth } from '../contexts/AuthContext';

const suggestedNurses = [
  { name: 'Nguyễn Thị Lan Anh', title: 'Điều dưỡng trưởng', avatar: 'LA', rating: 4.97, distance: '1.2km', price: '350k' },
  { name: 'Trần Minh Châu', title: 'Nữ hộ sinh cao cấp', avatar: 'MC', rating: 4.95, distance: '2.1km', price: '420k' },
  { name: 'Võ Thị Mỹ Linh', title: 'Chuyên gia hậu sản', avatar: 'ML', rating: 4.99, distance: '4.1km', price: '520k' },
];

const bookings = [
  { nurse: 'Trần Minh Châu', service: 'Hỗ trợ cho con bú', date: '14/05/2026', time: '10:00', avatar: 'MC', price: '420.000đ' },
  { nurse: 'Võ Thị Mỹ Linh', service: 'Phục hồi toàn diện', date: '20/05/2026', time: '09:00', avatar: 'ML', price: '520.000đ' },
];

const nurseSchedule = [
  { client: 'Chị Ngọc Hà', service: 'Chăm sóc hậu sản', time: '08:00', address: 'Quận 7, TP.HCM', status: 'Sắp tới' },
  { client: 'Chị Thu An', service: 'Tắm bé và chăm rốn', time: '14:00', address: 'Quận 3, TP.HCM', status: 'Sắp tới' },
  { client: 'Chị Minh Tâm', service: 'Hỗ trợ cho con bú', time: '16:30', address: 'Bình Thạnh, TP.HCM', status: 'Chờ xác nhận' },
];

const MotherHome = () => {
  const navigate = useNavigate();

  return (
    <>
      <Topbar title="Trang chủ" subtitle="Hôm nay mẹ và bé thế nào rồi?" />

      <section className="relative mb-6 overflow-hidden rounded-[28px] bg-grad p-7 shadow-lg">
        <div className="absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/10" />
        <div className="relative z-10 max-w-2xl">
          <div className="mb-2 text-xs font-black uppercase tracking-[1.8px] text-white/75">AI gợi ý hôm nay</div>
          <h2 className="font-serif text-3xl font-black leading-tight text-white">
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
            <div className="font-serif text-3xl font-black text-grad">{String(value)}</div>
            <div className="mt-1 text-xs font-bold text-text-light">{String(label)}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-serif text-xl font-black">Lịch hẹn sắp tới</h3>
            <Btn variant="ghost" size="sm" onClick={() => navigate('/mother/bookings')}>Xem tất cả</Btn>
          </div>
          {bookings.map((booking) => (
            <div key={`${booking.nurse}-${booking.time}`} className="flex items-center gap-3 border-b border-lav-200 py-4 last:border-b-0">
              <Avatar initials={booking.avatar} size={44} />
              <div className="min-w-0 flex-1">
                <div className="font-black">{booking.nurse}</div>
                <div className="text-sm text-text-light">{booking.service}</div>
                <div className="mt-1 text-xs font-bold text-text-light">{booking.date} · {booking.time}</div>
              </div>
              <div className="text-right text-sm font-black text-lav-dark">{booking.price}</div>
            </div>
          ))}
          <Btn full className="mt-4" onClick={() => navigate('/mother/search')}>Đặt lịch mới</Btn>
        </Card>

        <Card>
          <h3 className="font-serif text-xl font-black">AI gợi ý cho bạn</h3>
          <p className="mt-1 text-xs font-bold text-text-light">Dựa trên vị trí và nhu cầu chăm sóc</p>
          <div className="mt-4">
            {suggestedNurses.map((nurse) => (
              <div key={nurse.name} className="flex items-center gap-3 border-b border-lav-200 py-3 last:border-b-0">
                <Avatar initials={nurse.avatar} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-black">{nurse.name}</div>
                  <div className="truncate text-xs text-text-light">{nurse.title}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs font-bold text-text-light">
                    <Star size={12} className="fill-[#f59e0b] text-[#f59e0b]" /> {nurse.rating}
                    <MapPin size={12} /> {nurse.distance}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-lav-dark">{nurse.price}</div>
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

const NurseHome = () => (
  <>
    <Topbar title="Homepage nurse" subtitle="Quản lý lịch làm, checklist và thu nhập hôm nay." />

    <section className="relative mb-6 overflow-hidden rounded-[28px] bg-dark-200 p-7 text-white shadow-lg">
      <div className="absolute -right-12 -top-12 h-52 w-52 rounded-full bg-lav-acc/20" />
      <div className="relative z-10">
        <div className="mb-2 text-xs font-black uppercase tracking-[1.8px] text-lav-acc">Ca làm hôm nay</div>
        <h2 className="font-serif text-3xl font-black">Bạn có 2 ca sắp tới và 1 checklist cần hoàn tất.</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/58">Homepage này dành riêng cho nurse sau khi đăng nhập bằng phone + password.</p>
      </div>
    </section>

    <div className="mb-6 grid gap-4 md:grid-cols-4">
      {[
        [CalendarDays, '2', 'Ca hôm nay'],
        [ClipboardCheck, '86%', 'Checklist xong'],
        [Wallet, '1.240k', 'Doanh thu ngày'],
        [Star, '4.98', 'Đánh giá'],
      ].map(([Icon, value, label]) => (
        <Card key={String(label)} className="p-5 text-center">
          <Icon className="mx-auto mb-2 text-lav-dark" size={24} />
          <div className="font-serif text-3xl font-black text-grad">{String(value)}</div>
          <div className="mt-1 text-xs font-bold text-text-light">{String(label)}</div>
        </Card>
      ))}
    </div>

    <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
      <Card>
        <h3 className="mb-4 font-serif text-xl font-black">Lịch làm hôm nay</h3>
        {nurseSchedule.map((item) => (
          <div key={`${item.client}-${item.time}`} className="flex gap-3 border-b border-lav-200 py-4 last:border-b-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-lav-100 text-lav-dark">
              <Clock size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-black">{item.client}</span>
                <span className="rounded-full bg-lav-100 px-3 py-1 text-[11px] font-black text-lav-dark">{item.status}</span>
              </div>
              <div className="mt-1 text-sm text-text-light">{item.service}</div>
              <div className="mt-1 flex flex-wrap gap-3 text-xs font-bold text-text-light">
                <span>{item.time}</span>
                <span>{item.address}</span>
              </div>
            </div>
          </div>
        ))}
      </Card>

      <Card>
        <h3 className="font-serif text-xl font-black">Checklist nhanh</h3>
        <div className="mt-4 space-y-3">
          {['Rửa tay đúng quy trình', 'Kiểm tra nhiệt độ mẹ và bé', 'Ghi chú tình trạng ca chăm sóc', 'Gửi báo cáo sau ca'].map((item, index) => (
            <div key={item} className="flex items-center gap-3 rounded-2xl border border-lav-100 bg-[#fff9fb] p-3">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full ${index < 2 ? 'bg-verified-bg text-verified' : 'bg-lav-100 text-lav-dark'}`}>
                <CheckCircle2 size={16} />
              </div>
              <span className="text-sm font-bold text-text-mid">{item}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  </>
);

const Home = () => {
  const { primaryRole } = useAuth();
  return primaryRole === 'NURSE' ? <NurseHome /> : <MotherHome />;
};

export default Home;
