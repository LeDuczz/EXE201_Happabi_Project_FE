import { useState, useEffect } from 'react';
import { Search, Mail, Phone, MoreVertical } from 'lucide-react';
import Card from '../../components/common/Card';
import Avatar from '../../components/common/Avatar';
import Topbar from '../../components/layout/Topbar';
import Tag from '../../components/common/Tag';
import adminService from '../../api/adminService';

const UserManager = () => {
    const [users, setUsers] = useState<any[]>([]);

    const MOCK_USERS = [
        { id: '1', name: "Chị Ngọc Hà", email: "ha.ngoc@gmail.com", phone: "0901 234 567", role: 'MOTHER', joinDate: '2025-01-15', status: 'ACTIVE', bookings: 5 },
        { id: '2', name: "Chị Thu Thảo", email: "thao.n@yahoo.com", phone: "0912 345 678", role: 'MOTHER', joinDate: '2025-02-20', status: 'ACTIVE', bookings: 2 },
        { id: '3', name: "Nguyễn Lan Anh", email: "lananh.nurse@happabi.com", phone: "0934 567 890", role: 'NURSE', joinDate: '2025-01-10', status: 'ACTIVE', bookings: 124 },
    ];

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await adminService.getAllUsers();
                setUsers(res.data.data);
            } catch (err) {
                setUsers(MOCK_USERS);
            }
        };
        fetchUsers();
    }, []);

    return (
        <div className="pb-10">
            <Topbar title="Quản lý Người dùng" subtitle="Xem thông tin và quản trị tài khoản hệ thống." />

            <Card className="overflow-hidden p-0">
                <div className="flex items-center justify-between border-b border-lav-100 p-6">
                    <h3 className="font-serif text-xl font-black text-text-dark">Danh sách người dùng</h3>
                    <div className="flex gap-4">
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light" />
                            <input
                                placeholder="Tìm người dùng..."
                                className="rounded-xl border border-lav-100 py-2 pl-10 pr-4 text-sm outline-none focus:border-lav-acc"
                            />
                        </div>
                        <button className="flex items-center gap-2 rounded-xl bg-lav-100 px-4 py-2 text-sm font-bold text-lav-dark">
                            Bộ lọc
                        </button>
                    </div>
                </div>

                <table className="w-full text-left">
                    <thead className="bg-lav-50/50 text-[10px] font-black uppercase tracking-widest text-text-light">
                        <tr>
                            <th className="p-6">Người dùng</th>
                            <th className="p-6">Liên hệ</th>
                            <th className="p-6">Vai trò</th>
                            <th className="p-6">Ngày tham gia</th>
                            <th className="p-6">Hoạt động</th>
                            <th className="p-6">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-lav-100 divide-dashed">
                        {users.map(u => (
                            <tr key={u.id} className="group hover:bg-lav-50/30 transition-all">
                                <td className="p-6">
                                    <div className="flex items-center gap-3">
                                        <Avatar initials={u.name.split(' ').pop().substring(0, 2).toUpperCase()} size={36} />
                                        <span className="font-bold text-text-dark">{u.name}</span>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <div className="text-xs font-bold text-text-mid space-y-1">
                                        <div className="flex items-center gap-2"><Mail size={12} /> {u.email}</div>
                                        <div className="flex items-center gap-2"><Phone size={12} /> {u.phone}</div>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <Tag variant={u.role === 'ADMIN' ? 'grad' : (u.role === 'NURSE' ? 'purple' : 'pink')}>
                                        {u.role}
                                    </Tag>
                                </td>
                                <td className="p-6 text-sm font-bold text-text-light">
                                    {u.joinDate}
                                </td>
                                <td className="p-6">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-black text-lav-dark">{u.bookings} bookings</span>
                                        <div className="h-1.5 w-20 rounded-full bg-lav-100 overflow-hidden">
                                            <div className="h-full bg-lav-acc" style={{ width: `${Math.min(u.bookings * 10, 100)}%` }} />
                                        </div>
                                    </div>
                                </td>
                                <td className="p-6 text-center">
                                    <button className="rounded-lg p-2 text-text-light hover:bg-lav-100 hover:text-lav-dark">
                                        <MoreVertical size={20} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>

            <div className="mt-6 flex justify-center">
                <div className="flex gap-2">
                    {[1, 2, 3].map(p => (
                        <button key={p} className={`h-8 w-8 rounded-lg text-sm font-bold ${p === 1 ? 'bg-lav-acc text-white' : 'bg-white text-text-mid border border-lav-100 hover:border-lav-acc'}`}>
                            {p}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default UserManager;
