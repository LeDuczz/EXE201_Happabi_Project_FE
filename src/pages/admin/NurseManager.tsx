import { useState, useEffect } from 'react';
import { Search, Award, CheckCircle, ShieldAlert } from 'lucide-react';
import Card from '../../components/common/Card';
import Btn from '../../components/common/Btn';
import Avatar from '../../components/common/Avatar';
import Topbar from '../../components/layout/Topbar';
import Tag from '../../components/common/Tag';
import adminService from '../../api/adminService';

const NurseManager = () => {
    const [nurses, setNurses] = useState<any[]>([]);
    const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED'>('ALL');

    const MOCK_NURSES = [
        { id: '1', name: "Nguyễn Thị Lan Anh", title: "Điều dưỡng trưởng", status: 'VERIFIED', kyc: 'DONE', certs: 5, rating: 4.97, avatar: "LA", joinDate: '2025-01-10' },
        { id: '2', name: "Trần Minh Châu", title: "Nữ hộ sinh cao cấp", status: 'VERIFIED', kyc: 'DONE', certs: 3, rating: 4.95, avatar: "MC", joinDate: '2025-02-05' },
        { id: '3', name: "Lê Văn Tùng", title: "Điều dưỡng nhi", status: 'PENDING', kyc: 'WAITING', certs: 2, rating: 0, avatar: "VT", joinDate: '2025-05-20' },
    ];

    useEffect(() => {
        const fetchNurses = async () => {
            try {
                const res = await adminService.getAllNurses();
                setNurses(res.data.data);
            } catch (err) {
                setNurses(MOCK_NURSES);
            }
        };
        fetchNurses();
    }, []);

    const filteredNurses = nurses.filter(n => filter === 'ALL' || n.status === filter);

    const handleVerify = async (id: string, status: string) => {
        try {
            await adminService.verifyNurse(id, status);
            // Refresh
            const res = await adminService.getAllNurses();
            setNurses(res.data.data);
        } catch (err) {
            // For mock demo
            setNurses(nurses.map(n => n.id === id ? { ...n, status } : n));
        }
    };

    return (
        <div className="pb-10">
            <Topbar title="Quản lý Điều dưỡng" subtitle="Phê duyệt hồ sơ, xác thực chứng chỉ và KYC." />

            <div className="mb-6 flex items-center justify-between">
                <div className="flex gap-2">
                    {(['ALL', 'PENDING', 'VERIFIED'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`rounded-xl px-6 py-2 text-sm font-bold transition-all ${filter === f ? 'bg-dark-100 text-white' : 'bg-white text-text-mid border border-lav-100 hover:border-lav-acc'}`}
                        >
                            {f === 'ALL' ? 'Tất cả' : f === 'PENDING' ? 'Chờ duyệt' : 'Đã xác thực'}
                        </button>
                    ))}
                </div>
                <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light" />
                    <input
                        placeholder="Tìm theo tên/ID..."
                        className="rounded-xl border border-lav-100 py-2 pl-10 pr-4 text-sm outline-none focus:border-lav-acc"
                    />
                </div>
            </div>

            <div className="grid gap-4">
                {filteredNurses.map(n => (
                    <Card key={n.id} className="p-4 transition-all hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Avatar initials={n.avatar} size={50} />
                                <div>
                                    <h3 className="font-serif text-lg font-black text-text-dark">{n.name}</h3>
                                    <p className="text-xs font-bold text-text-light">{n.title} · Tham gia: {n.joinDate}</p>
                                </div>
                            </div>

                            <div className="flex gap-10">
                                <div className="text-center">
                                    <p className="text-[10px] font-black uppercase text-text-light">Trạng thái</p>
                                    <div className="mt-1">
                                        <Tag variant={n.status === 'VERIFIED' ? 'green' : 'orange'}>
                                            {n.status === 'VERIFIED' ? 'Verified' : 'Pending'}
                                        </Tag>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] font-black uppercase text-text-light">KYC</p>
                                    <div className="mt-1 flex justify-center text-verified">
                                        {n.kyc === 'DONE' ? <CheckCircle size={18} /> : <ShieldAlert size={18} className="text-danger" />}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] font-black uppercase text-text-light">Bằng cấp</p>
                                    <div className="mt-1 flex items-center justify-center gap-1 font-bold text-lav-dark">
                                        <Award size={18} /> {n.certs}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Btn variant="soft" size="sm">Xem hồ sơ</Btn>
                                {n.status === 'PENDING' && (
                                    <Btn variant="grad" size="sm" onClick={() => handleVerify(n.id, 'VERIFIED')}>Duyệt hồ sơ</Btn>
                                )}
                                {n.status === 'VERIFIED' && (
                                    <Btn variant="outline" size="sm" className="!text-danger !border-danger/20" onClick={() => handleVerify(n.id, 'PENDING')}>Khóa</Btn>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default NurseManager;
