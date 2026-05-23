import { useState, useEffect } from 'react';
import { Calendar, Clock, Search, Filter, Download } from 'lucide-react';
import Card from '../../components/common/Card';
import Avatar from '../../components/common/Avatar';
import Topbar from '../../components/layout/Topbar';
import { StatusBadge } from '../../components/common/Misc';
import adminService from '../../api/adminService';

const BookingManager = () => {
    const [bookings, setBookings] = useState<any[]>([]);

    const MOCK_BOOKINGS = [
        { id: "B001", motherName: "Chị Ngọc Hà", nurseName: "Nguyễn Thị Lan Anh", service: "Chăm sóc sau sinh", date: "2025-05-28", status: "PENDING", price: 350000, motherAvatar: "NH", nurseAvatar: "LA" },
        { id: "B002", motherName: "Chị Thu Thảo", nurseName: "Trần Minh Châu", service: "Tắm bé sơ sinh", date: "2025-05-24", status: "UPCOMING", price: 420000, motherAvatar: "TT", nurseAvatar: "MC" },
        { id: "B003", motherName: "Chị Hồng Nhung", nurseName: "Võ Thị Mỹ Linh", service: "Hỗ trợ cho con bú", date: "2025-05-20", status: "COMPLETED", price: 520000, motherAvatar: "HN", nurseAvatar: "ML" },
    ];

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const res = await adminService.getAllBookings();
                setBookings(res.data.data);
            } catch (err) {
                setBookings(MOCK_BOOKINGS);
            }
        };
        fetchBookings();
    }, []);

    return (
        <div className="pb-10">
            <Topbar title="Quản lý Lịch hẹn" subtitle="Theo dõi và điều phối toàn bộ lịch hẹn trên hệ thống." />

            <div className="mb-8 grid gap-4 grid-cols-4">
                {[
                    { label: 'Tổng đơn hàng', val: '1,248', icon: '📋', color: 'text-lav-dark' },
                    { label: 'Chờ xử lý', val: '42', icon: '⏳', color: 'text-yellow-600' },
                    { label: 'Hoàn thành', val: '856', icon: '✅', color: 'text-verified' },
                    { label: 'Doanh thu', val: '1.2B', icon: '💰', color: 'text-pink-dark' },
                ].map((s, i) => (
                    <Card key={i} className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase text-text-light tracking-widest">{s.label}</p>
                            <p className={`mt-1 font-serif text-2xl font-black ${s.color}`}>{s.val}</p>
                        </div>
                        <span className="text-2xl">{s.icon}</span>
                    </Card>
                ))}
            </div>

            <Card className="p-6 mb-6 flex items-center justify-between">
                <div className="flex gap-4 flex-1">
                    <div className="relative flex-1 max-w-md">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light" />
                        <input
                            placeholder="Tìm theo Mã đơn, tên mẹ, tên điều dưỡng..."
                            className="w-full rounded-xl border border-lav-100 py-2 pl-10 pr-4 text-sm outline-none focus:border-lav-acc"
                        />
                    </div>
                    <button className="flex items-center gap-2 rounded-xl border border-lav-100 px-4 py-2 text-sm font-bold text-text-mid hover:bg-lav-50">
                        <Filter size={18} /> Bộ lọc
                    </button>
                </div>
                <button className="flex items-center gap-2 rounded-xl bg-verified-bg px-4 py-2 text-sm font-bold text-verified hover:bg-verified/10">
                    <Download size={18} /> Xuất báo cáo
                </button>
            </Card>

            <div className="grid gap-4">
                {bookings.map(b => (
                    <Card key={b.id} className="p-5 hover:border-lav-acc cursor-pointer transition-all">
                        <div className="grid grid-cols-4 items-center gap-6">
                            <div className="col-span-1">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-lav-100 flex items-center justify-center font-black text-lav-dark text-xs">
                                        {b.id}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-text-light uppercase tracking-tighter">ID Lịch hẹn</p>
                                        <p className="font-bold text-text-dark">{b.service}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-1 border-l border-lav-100 pl-6">
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-2">
                                        <Avatar initials={b.motherAvatar} size={24} />
                                        <span className="text-xs font-bold text-text-dark">{b.motherName} (Mẹ)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Avatar initials={b.nurseAvatar} size={24} />
                                        <span className="text-xs font-bold text-text-dark">{b.nurseName} (Nurse)</span>
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-1 border-l border-lav-100 pl-6 text-sm font-bold text-text-mid space-y-1">
                                <div className="flex items-center gap-2"><Calendar size={14} /> {b.date}</div>
                                <div className="flex items-center gap-2 text-lav-dark"><Clock size={14} /> {(b.price / 1000).toFixed(0)}k đ</div>
                            </div>

                            <div className="col-span-1 flex flex-col items-end gap-2">
                                <StatusBadge status={b.status.toLowerCase()} />
                                <button className="text-[10px] font-black uppercase text-lav-acc hover:underline">Chi tiết logs</button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default BookingManager;
