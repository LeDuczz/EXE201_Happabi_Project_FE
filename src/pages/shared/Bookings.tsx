import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react';
import Card from '../../components/common/Card';
import Btn from '../../components/common/Btn';
import Avatar from '../../components/common/Avatar';
import Topbar from '../../components/layout/Topbar';
import { StatusBadge, Divider } from '../../components/common/Misc';
import { useAuth } from '../../contexts/AuthContext';
import bookingService, { type Booking } from '../../api/bookingService';

const Bookings = () => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'UPCOMING' | 'PENDING' | 'COMPLETED' | 'CANCELLED'>('UPCOMING');

    // Mock data for demo if API fails
    const MOCK_BOOKINGS: Booking[] = [
        { id: "B001", motherId: "M1", nurseId: "N1", nurseName: "Nguyễn Thị Lan Anh", nurseAvatar: "LA", service: "Chăm sóc sau sinh", date: "2025-05-28", time: "08:00", status: "PENDING", price: 350000, paymentType: 'CASH', address: "123 Nguyễn Văn Linh, Q7", note: "Bé trai 15 ngày tuổi" },
        { id: "B002", motherId: "M1", nurseId: "N2", nurseName: "Trần Minh Châu", nurseAvatar: "MC", service: "Hỗ trợ cho con bú", date: "2025-05-24", time: "10:00", status: "UPCOMING", price: 420000, paymentType: 'WALLET', address: "45 Lê Văn Sỹ, Q3" },
        { id: "B003", motherId: "M1", nurseId: "N3", nurseName: "Võ Thị Mỹ Linh", nurseAvatar: "ML", service: "Phục hồi toàn diện", date: "2025-04-20", time: "09:00", status: "COMPLETED", price: 520000, paymentType: 'CASH', address: "88 Đinh Tiên Hoàng, Q1" },
    ];

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const res = await bookingService.getMyBookings();
                setBookings(res.data.data);
            } catch (err) {
                console.warn("Using mock bookings due to API error");
                setBookings(MOCK_BOOKINGS);
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, []);

    const filteredBookings = bookings.filter(b => b.status === activeTab);

    const handleAction = async (id: string, action: 'accept' | 'reject' | 'complete') => {
        try {
            if (action === 'accept') await bookingService.acceptBooking(id);
            else if (action === 'reject') await bookingService.rejectBooking(id, "Bận lịch đột xuất");
            else if (action === 'complete') await bookingService.completeBooking(id);

            // Refresh
            const res = await bookingService.getMyBookings();
            setBookings(res.data.data);
        } catch (err) {
            alert("Cập nhật trạng thái thất bại. Vui lòng thử lại.");
        }
    };

    return (
        <div className="pb-10">
            <Topbar
                title={user?.roles?.includes('NURSE') ? "Lịch nhận đơn" : "Đơn của tôi"}
                subtitle={user?.roles?.includes('NURSE') ? "Quản lý các ca làm việc của bạn." : "Theo dõi lịch hẹn với điều dưỡng."}
            />

            <div className="mb-6 flex gap-2 border-b border-lav-100">
                {(['PENDING', 'UPCOMING', 'COMPLETED', 'CANCELLED'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 text-sm font-bold transition-all ${activeTab === tab ? 'border-b-2 border-lav-acc text-lav-dark' : 'text-text-light hover:text-text-mid'}`}
                    >
                        {tab === 'PENDING' ? 'Chờ xác nhận' : tab === 'UPCOMING' ? 'Sắp tới' : tab === 'COMPLETED' ? 'Hoàn thành' : 'Đã huỷ'}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex aspect-video items-center justify-center">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-lav-200 border-t-lav-acc" />
                </div>
            ) : filteredBookings.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-20 text-center">
                    <div className="mb-4 text-6xl opacity-20">📅</div>
                    <h3 className="font-serif text-2xl font-black text-text-dark">Không có đơn nào</h3>
                    <p className="mt-2 text-text-mid">Bạn chưa có bất kỳ lịch hẹn nào trong mục này.</p>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {filteredBookings.map(b => (
                        <Card key={b.id} className="p-6 transition-all hover:shadow-xl">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <Avatar initials={b.nurseAvatar} size={56} />
                                    <div>
                                        <h3 className="font-serif text-xl font-black text-text-dark">{b.nurseName}</h3>
                                        <p className="text-sm font-bold text-lav-dark">{b.service}</p>
                                        <div className="mt-1 flex items-center gap-4 text-xs font-bold text-text-light">
                                            <span className="flex items-center gap-1"><Calendar size={14} /> {b.date}</span>
                                            <span className="flex items-center gap-1"><Clock size={14} /> {b.time}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <StatusBadge status={b.status.toLowerCase()} />
                                    <p className="mt-2 font-serif text-2xl font-black text-lav-dark">{b.price.toLocaleString()}đ</p>
                                    <p className="text-[10px] font-bold text-text-light uppercase tracking-widest">{b.paymentType === 'CASH' ? 'Thanh toán tiền mặt' : 'Thanh toán ví'}</p>
                                </div>
                            </div>

                            <Divider />

                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center gap-2 text-sm text-text-mid">
                                        <MapPin size={16} className="text-lav-dark" />
                                        {b.address}
                                    </div>
                                    {b.note && (
                                        <div className="flex items-center gap-2 text-sm italic text-pink-dark">
                                            <AlertCircle size={16} />
                                            Ghi chú: {b.note}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    {user?.roles?.includes('NURSE') && b.status === 'PENDING' && (
                                        <>
                                            <Btn variant="outline" size="sm" onClick={() => handleAction(b.id, 'reject')}>Từ chối</Btn>
                                            <Btn variant="grad" size="sm" onClick={() => handleAction(b.id, 'accept')}>Chấp nhận đơn</Btn>
                                        </>
                                    )}
                                    {user?.roles?.includes('NURSE') && b.status === 'UPCOMING' && (
                                        <Btn variant="grad" size="sm" onClick={() => handleAction(b.id, 'complete')}>Hoàn thành ca</Btn>
                                    )}
                                    {user?.roles?.includes('MOTHER') && b.status === 'UPCOMING' && (
                                        <Btn variant="outline" size="sm" onClick={() => handleAction(b.id, 'reject')}>Huỷ lịch</Btn>
                                    )}
                                    <Btn variant="soft" size="sm">Chi tiết ca làm</Btn>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {user?.roles?.includes('NURSE') && (
                <Card className="mt-8 bg-lav-50/50 p-4 border-dashed border-2 border-lav-200">
                    <div className="flex items-center gap-4 text-sm font-bold text-text-mid">
                        <div className="rounded-full bg-lav-acc p-2 text-white">
                            <CheckCircle2 size={16} />
                        </div>
                        Lưu ý: Với đơn hàng thanh toán tiền mặt, 10% phí hoa hồng sẽ được trừ trực tiếp vào ví của bạn sau khi nhấn "Chấp nhận".
                    </div>
                </Card>
            )}
        </div>
    );
};

export default Bookings;
