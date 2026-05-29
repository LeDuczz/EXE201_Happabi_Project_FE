import { useMemo, useState } from 'react';
import { CalendarDays, Check, Clock, MapPin, Phone, X } from 'lucide-react';
import Card from '../../components/common/Card';
import Btn from '../../components/common/Btn';
import Avatar from '../../components/common/Avatar';
import Topbar from '../../components/layout/Topbar';
import type { Booking } from '../../api/bookingService';

const mockBookings: Booking[] = [
  {
    id: 'B001',
    motherName: 'Chị Ngọc Hà',
    service: 'Chăm sóc hậu sản',
    dateTime: '2026-05-28 08:00',
    status: 'PENDING',
    price: 350000,
    address: 'Quận 7, TP.HCM',
    motherAvatar: 'NH',
  },
  {
    id: 'B002',
    motherName: 'Chị Thu An',
    service: 'Tắm bé và chăm rốn',
    dateTime: '2026-05-28 14:00',
    status: 'ACCEPTED',
    price: 250000,
    address: 'Quận 3, TP.HCM',
    motherAvatar: 'TA',
  },
];

const tabs = ['Tất cả', 'Chưa xác nhận', 'Đã xác nhận', 'Hôm nay', 'Hoàn thành'];

const Bookings = () => {
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);
  const [activeTab, setActiveTab] = useState('Tất cả');
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  const filteredBookings = useMemo(() => {
    if (activeTab === 'Chưa xác nhận') {
      return bookings.filter((booking) => booking.status === 'PENDING');
    }
    if (activeTab === 'Đã xác nhận') {
      return bookings.filter((booking) => booking.status === 'ACCEPTED');
    }
    if (activeTab === 'Hoàn thành') {
      return bookings.filter((booking) => booking.status === 'COMPLETED');
    }
    return bookings;
  }, [activeTab, bookings]);

  const handleAccept = (id: string) => {
    setIsActionLoading(id);
    window.setTimeout(() => {
      setBookings((current) => current.map((booking) => (
        booking.id === id ? { ...booking, status: 'ACCEPTED' } : booking
      )));
      setIsActionLoading(null);
    }, 250);
  };

  const handleReject = (id: string) => {
    setIsActionLoading(id);
    window.setTimeout(() => {
      setBookings((current) => current.map((booking) => (
        booking.id === id ? { ...booking, status: 'REJECTED' } : booking
      )));
      setIsActionLoading(null);
    }, 250);
  };

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="pb-10">
      <Topbar
        title="Lịch làm việc"
        subtitle="Dữ liệu mẫu để kiểm thử UI. Khi backend booking sẵn sàng, trang này sẽ nối API thật."
      />

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap rounded-full px-5 py-2 text-xs font-black tracking-wide transition ${activeTab === tab ? 'bg-lav-acc text-white' : 'bg-lav-100 text-lav-dark hover:bg-lav-200'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid gap-5">
        {filteredBookings.map((booking) => (
          <Card key={booking.id} className="border-none bg-dark-100 p-0 text-white shadow-lg transition-transform hover:scale-[1.01]">
            <div className="flex flex-col md:flex-row">
              <div className="flex-1 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar initials={booking.motherAvatar} size={48} />
                    <div>
                      <div className="text-lg font-black">{booking.motherName}</div>
                      <div className="text-xs font-bold text-lav-acc">{booking.service}</div>
                    </div>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white/60">
                    <Clock size={16} className="text-lav-acc" /> {booking.dateTime}
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-white/60">
                    <MapPin size={16} className="text-lav-acc" /> {booking.address}
                  </div>
                </div>
              </div>

              <div className="flex w-full flex-col border-white/5 bg-white/5 p-6 md:w-[280px] md:border-l">
                <div className="mb-6 flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-[2px] text-white/30">Thu nhập dự kiến</span>
                  <span className="font-serif text-2xl font-black text-white">{formatVND(booking.price)}</span>
                </div>

                <div className="mt-auto space-y-2">
                  {booking.status === 'PENDING' ? (
                    <div className="flex gap-2">
                      <Btn
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        size="sm"
                        onClick={() => handleAccept(booking.id)}
                        disabled={isActionLoading === booking.id}
                      >
                        <Check size={16} /> Chấp nhận
                      </Btn>
                      <button
                        type="button"
                        className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 transition hover:bg-red-500/10 hover:text-red-500"
                        onClick={() => handleReject(booking.id)}
                        disabled={isActionLoading === booking.id}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <Btn full variant="outline" className="border-white/10 text-white/80 hover:bg-white/5" size="sm">
                      <Phone size={16} /> Liên hệ ngay
                    </Btn>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredBookings.length === 0 && (
        <Card className="flex flex-col items-center justify-center border-none bg-dark-100 py-20 text-center text-white">
          <CalendarDays size={64} className="mb-4 text-lav-acc opacity-20" />
          <h3 className="font-serif text-2xl font-black">Chưa có lịch làm việc</h3>
          <p className="mt-2 text-sm font-bold text-white/40">Dữ liệu mẫu chưa có đơn phù hợp với bộ lọc hiện tại.</p>
        </Card>
      )}
    </div>
  );
};

const StatusBadge = ({ status }: { status: Booking['status'] }) => {
  const className = status === 'PENDING'
    ? 'bg-amber-500/10 text-amber-500'
    : status === 'ACCEPTED'
      ? 'bg-green-500/10 text-green-500'
      : status === 'REJECTED'
        ? 'bg-red-500/10 text-red-400'
        : 'bg-white/10 text-white/40';

  return (
    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${className}`}>
      {status}
    </span>
  );
};

export default Bookings;
