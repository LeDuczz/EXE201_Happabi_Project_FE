import { useEffect, useState } from 'react';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, History, CreditCard, AlertCircle } from 'lucide-react';
import Card from '../../components/common/Card';
import Btn from '../../components/common/Btn';
import Topbar from '../../components/layout/Topbar';
import walletService from '../../api/walletService';
import type { WalletResponse, Transaction } from '../../api/walletService';

const Wallet = () => {
    const [wallet, setWallet] = useState<WalletResponse | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [topUpAmount, setTopUpAmount] = useState<number>(100000);
    const [showTopUp, setShowTopUp] = useState(false);

    useEffect(() => {
        // Mock data for initial development if API fails
        const fetchData = async () => {
            try {
                const [walletRes, transRes] = await Promise.all([
                    walletService.getWallet(),
                    walletService.getTransactions()
                ]);
                setWallet(walletRes.data.data);
                setTransactions(transRes.data.data);
            } catch (err) {
                console.error("Failed to fetch wallet data, using mocks", err);
                setWallet({ balance: 240000, pledgeBalance: 1000000 });
                setTransactions([
                    { id: '1', type: 'TOP_UP', amount: 500000, status: 'SUCCESS', createdAt: '2026-05-20T10:00:00Z', description: 'Nạp tiền vào ví' },
                    { id: '2', type: 'FEE', amount: 35000, status: 'SUCCESS', createdAt: '2026-05-19T14:00:00Z', description: 'Phí hoa hồng ca Chị Ngọc Hà' },
                    { id: '3', type: 'TOP_UP', amount: 200000, status: 'PENDING', createdAt: '2026-05-22T08:00:00Z', description: 'Nạp tiền qua PayOS' },
                ]);
            }
        };
        fetchData();
    }, []);

    const handleTopUp = async () => {
        try {
            const res = await walletService.createTopUpLink(topUpAmount, 'TOP_UP');
            if (res.data.data) {
                window.location.href = res.data.data; // Redirect to PayOS
            }
        } catch (err) {
            alert("Không thể tạo liên kết thanh toán. Vui lòng thử lại sau.");
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'SUCCESS': return 'bg-verified-bg text-verified';
            case 'PENDING': return 'bg-lav-100 text-lav-dark';
            case 'FAILED': return 'bg-danger-bg text-danger';
            default: return 'bg-gray-100 text-gray-500';
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <div className="pb-10">
            <Topbar title="Ví của tôi" subtitle="Quản lý số dư, ký quỹ và lịch sử giao dịch." />

            <div className="mb-8 grid gap-6 md:grid-cols-2">
                <Card className="relative overflow-hidden bg-dark-100 p-8 text-white shadow-xl">
                    <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-lav-acc/20 blur-2xl" />
                    <div className="relative z-10">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                                <WalletIcon className="text-lav-acc" size={20} />
                            </div>
                            <span className="text-sm font-bold tracking-wider text-lav-100 uppercase">Số dư ví</span>
                        </div>
                        <div className="mb-6 font-serif text-4xl font-black italic">
                            {wallet ? formatCurrency(wallet.balance) : '---'}
                        </div>
                        <Btn variant="grad" className="px-8" onClick={() => setShowTopUp(true)}>Nạp tiền ngay</Btn>
                    </div>
                </Card>

                <Card className="p-8 shadow-lg">
                    <div className="mb-4 flex items-center gap-3 text-text-dark">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-lav-100">
                            <CreditCard className="text-lav-dark" size={20} />
                        </div>
                        <span className="text-sm font-bold tracking-wider text-text-light uppercase">Tiền ký quỹ (Pledge)</span>
                    </div>
                    <div className="mb-2 font-serif text-4xl font-black text-text-dark">
                        {wallet ? formatCurrency(wallet.pledgeBalance) : '---'}
                    </div>
                    <div className="flex items-start gap-2 text-xs text-text-light">
                        <AlertCircle size={14} className="mt-0.5 shrink-0" />
                        <p>Tiền ký quỹ dùng để đảm bảo điều kiện nhận các đơn thanh toán bằng tiền mặt. Số tiền này chỉ được nạp, không được rút.</p>
                    </div>
                </Card>
            </div>

            <div className="mb-8 rounded-2xl bg-pink-50 p-6 border-2 border-dashed border-pink-200">
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-pink-100 text-pink-dark">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <h4 className="font-serif text-lg font-black text-pink-dark">Lưu ý về đơn Tiền mặt</h4>
                        <p className="mt-1 text-sm text-text-mid leading-relaxed">
                            Đối với các đơn khách hàng trả bằng <strong>Tiền mặt</strong>, hệ thống sẽ trừ trực tiếp <strong>10% phí hoa hồng</strong> vào ví của bạn ngay khi nhận đơn.
                            Nếu tổng số dư và ký quỹ của bạn thấp hơn 10% giá trị đơn, bạn sẽ không thể nhận đơn đó.
                        </p>
                    </div>
                </div>
            </div>

            <Card className="shadow-lg">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <History className="text-lav-dark" size={24} />
                        <h2 className="font-serif text-2xl font-black text-text-dark">Lịch sử giao dịch</h2>
                    </div>
                    <Btn variant="ghost" size="sm">Xem thêm</Btn>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-lav-200 text-left text-xs font-black tracking-wider text-text-light uppercase">
                                <th className="pb-4 pt-2">Loại giao dịch</th>
                                <th className="pb-4 pt-2">Ngày thực hiện</th>
                                <th className="pb-4 pt-2">Số tiền</th>
                                <th className="pb-4 pt-2">Trạng thái</th>
                                <th className="pb-4 pt-2">Mô tả</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-lav-100">
                            {transactions.map((t) => (
                                <tr key={t.id} className="text-sm">
                                    <td className="py-4">
                                        <div className="flex items-center gap-2 font-bold">
                                            {t.type === 'TOP_UP' ? (
                                                <ArrowUpRight className="text-verified" size={16} />
                                            ) : (
                                                <ArrowDownLeft className="text-danger" size={16} />
                                            )}
                                            {t.type === 'TOP_UP' ? 'Nạp tiền' : t.type === 'FEE' ? 'Phí hoa hồng' : 'Hoàn tiền'}
                                        </div>
                                    </td>
                                    <td className="py-4 text-text-mid">{new Date(t.createdAt).toLocaleDateString('vi-VN')}</td>
                                    <td className={`py-4 font-black ${t.type === 'TOP_UP' ? 'text-verified' : 'text-danger'}`}>
                                        {t.type === 'TOP_UP' ? '+' : '-'}{formatCurrency(t.amount)}
                                    </td>
                                    <td className="py-4">
                                        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${getStatusStyle(t.status)}`}>
                                            {t.status === 'SUCCESS' ? 'Thành công' : t.status === 'PENDING' ? 'Đang xử lý' : 'Thất bại'}
                                        </span>
                                    </td>
                                    <td className="py-4 text-text-light">{t.description}</td>
                                </tr>
                            ))}
                            {transactions.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-10 text-center text-text-light italic">Chưa có giao dịch nào</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Top up modal/dialog simplifies for quick UI */}
            {showTopUp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
                    <Card className="w-full max-w-md p-8 shadow-2xl">
                        <h3 className="mb-6 font-serif text-2xl font-black text-text-dark">Nạp tiền vào ví</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-bold text-text-mid">Chọn hoặc nhập số tiền (VND)</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[100000, 200000, 500000].map((amt) => (
                                        <button
                                            key={amt}
                                            onClick={() => setTopUpAmount(amt)}
                                            className={`rounded-xl border-2 py-2 text-sm font-bold transition-all ${topUpAmount === amt ? 'border-lav-acc bg-lav-100 text-lav-dark' : 'border-lav-200 text-text-light hover:border-lav-300'}`}
                                        >
                                            {amt / 1000}k
                                        </button>
                                    ))}
                                </div>
                                <input
                                    type="number"
                                    value={topUpAmount}
                                    onChange={(e) => setTopUpAmount(Number(e.target.value))}
                                    className="mt-4 w-full rounded-xl border-2 border-lav-200 bg-white p-3 font-bold text-text-dark outline-none focus:border-lav-acc"
                                    placeholder="Nhập số tiền khác..."
                                />
                            </div>
                            <div className="rounded-xl bg-lav-100 p-4 border border-lav-200">
                                <div className="flex items-center gap-2 text-lav-dark font-black">
                                    <CreditCard size={18} />
                                    <span>Xác nhận nạp qua PayOS</span>
                                </div>
                                <p className="mt-1 text-xs text-text-mid">Bạn sẽ được chuyển hướng đến trang thanh toán của PayOS.</p>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <Btn variant="outline" full onClick={() => setShowTopUp(false)}>Hủy</Btn>
                                <Btn variant="grad" full onClick={handleTopUp}>Tiếp tục</Btn>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Wallet;
