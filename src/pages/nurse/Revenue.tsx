import { useState, useEffect } from 'react';
import { Wallet, ArrowUpRight, ArrowDownLeft, History, Plus, CreditCard, ShieldCheck, AlertCircle } from 'lucide-react';
import Card from '../../components/common/Card';
import Btn from '../../components/common/Btn';
import Topbar from '../../components/layout/Topbar';
import walletService, { type WalletInfo } from '../../api/walletService';

const Revenue = () => {
    const [wallet, setWallet] = useState<WalletInfo | null>(null);
    const [, setLoading] = useState(true);
    const [topupAmount, setTopupAmount] = useState('100000');
    const [isProcessing, setIsProcessing] = useState(false);

    const MOCK_WALLET: WalletInfo = {
        balance: 1240000,
        pledgeAmount: 500000,
        transactions: [
            { id: 'T001', amount: 100000, type: 'TOPUP', status: 'SUCCESS', createdAt: '2025-05-20 10:30', description: 'Nạp tiền qua PayOS' },
            { id: 'T002', amount: -35000, type: 'COMMISSION', status: 'SUCCESS', createdAt: '2025-05-19 14:20', description: 'Chiết khấu 10% đơn B001 (Tiền mặt)' },
            { id: 'T003', amount: 450000, type: 'TOPUP', status: 'SUCCESS', createdAt: '2025-05-18 09:15', description: 'Nạp tiền ký quỹ' },
        ]
    };

    const fetchWallet = async () => {
        try {
            const res = await walletService.getWalletInfo();
            setWallet(res.data.data || MOCK_WALLET);
        } catch (err) {
            setWallet(MOCK_WALLET);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWallet();
    }, []);

    const handleTopUp = async () => {
        setIsProcessing(true);
        try {
            console.log(topupAmount);
            const res = await walletService.createTopUpLink(Number(topupAmount), 'TOPUP_WALLET');
            console.log(res);
            if (res.data.data?.checkoutUrl) {
                window.location.href = res.data.data.checkoutUrl;
            }
        } catch (err) {
            alert('Không thể tạo link thanh toán. Vui lòng thử lại sau.');
        } finally {
            setIsProcessing(false);
        }
    };

    const formatVND = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <div className="pb-10">
            <Topbar
                title="Doanh thu & Ví"
                subtitle="Quản lý số dư, tiền ký quỹ và lịch sử giao dịch."
            />

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Balance Card */}
                <Card className="relative overflow-hidden bg-grad p-8 text-white shadow-xl lg:col-span-2 border-none">
                    <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-white/70">
                            <Wallet size={14} /> Số dư khả dụng
                        </div>
                        <div className="mt-2 font-serif text-5xl font-black">{formatVND(wallet?.balance || 0)}</div>

                        <div className="mt-8 flex flex-wrap gap-6 border-t border-white/20 pt-6">
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-white/60">Tiền ký quỹ (Pledge)</div>
                                <div className="mt-1 flex items-center gap-1.5 text-lg font-bold">
                                    <ShieldCheck size={18} className="text-white/80" />
                                    {formatVND(wallet?.pledgeAmount || 0)}
                                </div>
                            </div>
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-white/60">Tổng tài sản</div>
                                <div className="mt-1 text-lg font-bold">
                                    {formatVND((wallet?.balance || 0) + (wallet?.pledgeAmount || 0))}
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Quick Top Up */}
                <Card className="border-none bg-white p-6 shadow-lg">
                    <div className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-lav-acc">
                        <Plus size={16} /> Nạp tiền nhanh
                    </div>
                    <p className="mb-4 text-xs font-semibold text-text-mid">Nạp thêm tiền vào ví để đảm bảo điều kiện nhận đơn tiền mặt (Chiết khấu 10%).</p>
                    <div className="space-y-4">
                        <div className="relative">
                            <input
                                type="number"
                                value={topupAmount}
                                onChange={(e) => setTopupAmount(e.target.value)}
                                className="w-full rounded-2xl border border-lav-100 bg-lav-50/50 px-4 py-3 font-black text-text-dark outline-none focus:border-lav-acc/50"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-text-light">VND</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {['100000', '200000', '500000', '1000000'].map(amt => (
                                <button
                                    key={amt}
                                    onClick={() => setTopupAmount(amt)}
                                    className={`rounded-xl border px-3 py-2 text-xs font-black transition ${topupAmount === amt ? 'border-lav-acc bg-lav-acc/10 text-lav-acc' : 'border-lav-100 text-text-light hover:bg-lav-50'}`}
                                >
                                    {parseInt(amt) / 1000}k
                                </button>
                            ))}
                        </div>
                        <Btn full variant="grad" onClick={handleTopUp} disabled={isProcessing}>
                            <CreditCard size={16} /> {isProcessing ? 'Đang xử lý...' : 'Nạp qua PayOS'}
                        </Btn>
                    </div>
                </Card>
            </div>

            {/* Commission Info Alert */}
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-lav-acc/20 bg-lav-acc/5 p-4 text-sm font-bold text-lav-acc">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <p>Theo quy định, đối với các đơn thanh toán bằng **Tiền mặt**, hệ thống sẽ khấu trừ trực tiếp **10% hoa hồng** từ số dư ví của bạn ngay khi bạn hoàn thành ca làm việc. Vui lòng duy trì số dư tối thiểu để được ưu tiên nhận đơn.</p>
            </div>

            {/* Transactions History */}
            <div className="mt-8">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 font-serif text-xl font-black text-black">
                        <History size={20} className="text-lav-acc" /> Lịch sử giao dịch
                    </h3>
                    <Btn variant="ghost" size="sm" className="text-black/60 hover:text-black">Xem báo cáo tháng</Btn>
                </div>
                <Card className="overflow-hidden border border-lav-200 bg-white p-0 shadow-lg">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-lav-100 bg-lav-50 text-[10px] font-black uppercase tracking-widest text-text-light">
                                    <th className="p-4">Thời gian</th>
                                    <th className="p-4">Nội dung</th>
                                    <th className="p-4">Loại</th>
                                    <th className="p-4 text-right">Số tiền</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-lav-50">
                                {wallet?.transactions.map((tx) => (
                                    <tr key={tx.id} className="transition hover:bg-lav-50/50">
                                        <td className="p-4 text-xs font-semibold text-text-light">{tx.createdAt}</td>
                                        <td className="p-4 text-sm font-bold text-text-dark">{tx.description}</td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${tx.type === 'TOPUP' ? 'bg-green-500/10 text-green-500' :
                                                tx.type === 'COMMISSION' ? 'bg-amber-500/10 text-amber-500' : 'bg-lav-100 text-lav-dark'
                                                }`}>
                                                {tx.type === 'TOPUP' ? <ArrowUpRight size={10} /> : <ArrowDownLeft size={10} />}
                                                {tx.type}
                                            </span>
                                        </td>
                                        <td className={`p-4 text-right font-black ${tx.amount > 0 ? 'text-green-500' : 'text-amber-500'}`}>
                                            {tx.amount > 0 ? '+' : ''}{formatVND(tx.amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Revenue;
