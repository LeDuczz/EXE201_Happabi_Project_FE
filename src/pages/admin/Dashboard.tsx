import { BarChart3, Loader2, RefreshCw, TrendingUp, UserCheck, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import Card from '../../components/common/Card';
import Topbar from '../../components/layout/Topbar';
import { getApiErrorMessage } from '../../utils/apiError';

interface SummaryData {
    totalUsers: number;
    totalNurses: number;
    totalGmv: number;
}

const AdminDashboard = () => {
    const [summary, setSummary] = useState<SummaryData | null>(null);
    const [gmvData, setGmvData] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const loadData = async () => {
        setIsLoading(true);
        setError('');
        try {
            const [sumRes, gmvRes] = await Promise.all([
                axiosClient.get('/api/admin/analytics/summary'),
                axiosClient.get('/api/admin/analytics/gmv/daily')
            ]);
            setSummary(sumRes.data?.data);
            setGmvData(gmvRes.data?.data || {});
        } catch (err: any) {
            setError(getApiErrorMessage(err, 'Không tải được dữ liệu thống kê.'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, []);

    return (
        <>
            <Topbar title="Hệ thống Happabi" subtitle="Tổng quan hoạt động kinh doanh và tăng trưởng của nền tảng." />

            {isLoading ? (
                <div className="flex h-96 items-center justify-center">
                    <Loader2 className="animate-spin text-lav-dark" size={40} />
                </div>
            ) : error ? (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-10 text-center">
                    <div className="font-semibold text-red-600">{error}</div>
                    <button onClick={loadData} className="mt-4 text-sm font-bold text-red-700 underline">Thử lại</button>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid gap-5 md:grid-cols-3">
                        <StatCard
                            icon={<Users className="text-blue-500" />}
                            label="Tổng người dùng"
                            value={summary?.totalUsers || 0}
                            color="bg-blue-50"
                        />
                        <StatCard
                            icon={<UserCheck className="text-green-500" />}
                            label="Tổng điều dưỡng"
                            value={summary?.totalNurses || 0}
                            color="bg-green-50"
                        />
                        <StatCard
                            icon={<TrendingUp className="text-lav-dark" />}
                            label="Tổng GMV (VND)"
                            value={(summary?.totalGmv || 0).toLocaleString()}
                            color="bg-lav-50"
                        />
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <Card className="p-6">
                            <div className="mb-6 flex items-center justify-between">
                                <div className="flex items-center gap-2 font-semibold text-text-dark">
                                    <BarChart3 size={20} className="text-lav-dark" />
                                    Biểu đồ Doanh thu (30 ngày)
                                </div>
                                <button onClick={loadData} className="text-text-light hover:text-lav-dark">
                                    <RefreshCw size={18} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {Object.entries(gmvData).reverse().slice(0, 10).map(([date, val]) => (
                                    <div key={date} className="flex items-center gap-4">
                                        <div className="w-24 text-xs font-bold text-text-light">{new Date(date).toLocaleDateString('vi-VN')}</div>
                                        <div className="flex-1 h-3 rounded-full bg-lav-50 overflow-hidden">
                                            <div
                                                className="h-full bg-grad transition-all duration-1000"
                                                style={{ width: `${Math.min((val / (summary?.totalGmv || 1)) * 500, 100)}%` }}
                                            />
                                        </div>
                                        <div className="w-32 text-right text-sm font-semibold text-text-dark">
                                            {val.toLocaleString()}đ
                                        </div>
                                    </div>
                                ))}
                                {!Object.keys(gmvData).length && (
                                    <div className="py-20 text-center text-sm font-semibold text-text-light italic">
                                        Chưa có dữ liệu giao dịch trong 30 ngày qua.
                                    </div>
                                )}
                            </div>
                        </Card>

                        <Card className="p-6">
                            <div className="font-semibold text-text-dark mb-4">Cảnh báo hệ thống</div>
                            <div className="space-y-3">
                                <AlertItem type="warning" title="Hồ sơ nurse chờ duyệt" message="Hiện có hồ sơ đang chờ bộ phận chuyên môn phê duyệt." />
                                <AlertItem type="info" title="Lịch trình hôm nay" message="Hệ thống vận hành ổn định, không ghi nhận sự cố server." />
                            </div>
                        </Card>
                    </div>
                </div>
            )}
        </>
    );
};

const StatCard = ({ icon, label, value, color }: { icon: any, label: string, value: string | number, color: string }) => (
    <Card className={`p-6 border-none ${color}`}>
        <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-white p-3 shadow-sm">{icon}</div>
            <div>
                <div className="text-xs font-bold uppercase tracking-wider text-text-mid opacity-70">{label}</div>
                <div className="text-2xl font-semibold text-text-dark mt-1">{value}</div>
            </div>
        </div>
    </Card>
);

const AlertItem = ({ type, title, message }: { type: 'warning' | 'info' | 'error', title: string, message: string }) => {
    const styles = {
        warning: 'border-amber-100 bg-amber-50 text-amber-700',
        info: 'border-blue-100 bg-blue-50 text-blue-700',
        error: 'border-red-100 bg-red-50 text-red-700'
    };
    return (
        <div className={`rounded-xl border p-4 ${styles[type]}`}>
            <div className="text-sm font-semibold">{title}</div>
            <div className="mt-1 text-xs font-semibold opacity-80">{message}</div>
        </div>
    );
};

export default AdminDashboard;
