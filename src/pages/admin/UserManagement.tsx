import { Search, User, Loader2, Ban, CheckCircle, Shield } from 'lucide-react';
import { useEffect, useState, useCallback, useRef } from 'react';
import axiosClient from '../../api/axiosClient';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Topbar from '../../components/layout/Topbar';
import Pagination from '../../components/common/Pagination';
import { getApiErrorMessage } from '../../utils/apiError';
import Btn from '../../components/common/Btn';

interface UserData {
    id: string;
    email: string;
    phone: string;
    fullName: string;
    isActive: boolean;
    roles: string[];
    createdAt: string;
}

const AdminUserManagement = () => {
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const [error, setError] = useState('');

    // Search & Pagination state
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const pageSize = 10;

    const loadUsers = useCallback(async (search?: string, pageNumber = 0) => {
        setIsLoading(true);
        setError('');
        try {
            let url = `/api/v1/admin/users?page=${pageNumber}&size=${pageSize}`;
            if (search) {
                url += `&query=${encodeURIComponent(search)}`;
            }
            const response = await axiosClient.get(url);
            const data = response.data?.data;
            setUsers(data?.content || []);
            setTotalPages(data?.totalPages || 0);
            setTotalElements(data?.totalElements || 0);
        } catch (err: any) {
            setError(getApiErrorMessage(err, 'Không tải được danh sách người dùng.'));
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Debounce search
    const searchTimeoutRef = useRef<any>(null);
    useEffect(() => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => {
            setPage(0);
            void loadUsers(query, 0);
        }, 400);
        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, [query, loadUsers]);

    const handleToggleStatus = async (userId: string) => {
        setIsProcessing(userId);
        try {
            await axiosClient.post(`/api/v1/admin/users/${userId}/toggle-status`);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !u.isActive } : u));
        } catch (err: any) {
            alert(getApiErrorMessage(err, 'Không thể thay đổi trạng thái người dùng.'));
        } finally {
            setIsProcessing(null);
        }
    };

    const onPageChange = (newPage: number) => {
        setPage(newPage);
        void loadUsers(query, newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <>
            <Topbar title="Quản lý người dùng" subtitle="Kiểm soát tài khoản, phân quyền và trạng thái hoạt động của người dùng Happabi." />

            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="w-full max-w-md">
                    <Input
                        placeholder="Tìm kiếm theo tên, email, số điện thoại..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        icon={<Search size={18} />}
                    />
                </div>
                <div className="text-sm font-bold text-text-light">
                    Tổng số: <span className="text-lav-dark">{totalElements}</span> người dùng
                </div>
            </div>

            {isLoading && page === 0 ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="animate-spin text-lav-dark" size={32} />
                </div>
            ) : error ? (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center font-bold text-red-600">
                    {error}
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    <Card className="overflow-hidden shadow-sm border-lav-100">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-lav-100 bg-lav-50/50">
                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-mid">Thành viên</th>
                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-mid">Liên hệ</th>
                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-mid">Vai trò</th>
                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-mid">Trạng thái</th>
                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-mid">Tiện ích</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-lav-100">
                                    {users.map((user) => (
                                        <tr key={user.id} className={`hover:bg-lav-50/30 transition-colors ${!user.isActive ? 'bg-red-50/10' : ''}`}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${user.isActive ? 'bg-lav-100 text-lav-dark' : 'bg-red-100 text-red-600'}`}>
                                                        <User size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-text-dark">{user.fullName || 'Người dùng mới'}</div>
                                                        <div className="text-[10px] font-bold uppercase tracking-wider text-text-mid opacity-60">ID: {user.id.slice(0, 8)}...</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-text-dark">{user.email}</div>
                                                <div className="mt-1 text-xs font-semibold text-text-light">{user.phone}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {user.roles?.map((role, idx) => (
                                                        <span key={idx} className="inline-flex items-center gap-1 rounded-md bg-lav-50 px-2 py-0.5 text-[10px] font-semibold text-lav-dark ring-1 ring-inset ring-lav-200">
                                                            <Shield size={10} /> {role}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${user.isActive ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-red-50 text-red-700 ring-red-600/20'}`}>
                                                    {user.isActive ? <CheckCircle size={10} /> : <Ban size={10} />}
                                                    {user.isActive ? 'ĐANG HOẠT ĐỘNG' : 'ĐÃ KHÓA'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Btn
                                                    variant={user.isActive ? 'outline' : 'danger'}
                                                    size="xs"
                                                    onClick={() => handleToggleStatus(user.id)}
                                                    disabled={isProcessing === user.id}
                                                    className="h-8 min-w-[100px]"
                                                >
                                                    {isProcessing === user.id ? (
                                                        <Loader2 size={14} className="animate-spin" />
                                                    ) : user.isActive ? (
                                                        <>Khóa User</>
                                                    ) : (
                                                        <>Mở khóa</>
                                                    )}
                                                </Btn>
                                            </td>
                                        </tr>
                                    ))}
                                    {!users.length && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-10 text-center text-sm font-bold text-text-light italic">
                                                Không tìm thấy người dùng phù hợp.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={onPageChange}
                        isLoading={isLoading}
                    />
                </div>
            )}
        </>
    );
};

export default AdminUserManagement;
