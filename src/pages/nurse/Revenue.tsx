import { ArrowDownLeft, ArrowUpRight, CreditCard, History, Loader2, Plus, ShieldCheck, Wallet, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import Card from '../../components/common/Card';
import Btn from '../../components/common/Btn';
import Topbar from '../../components/layout/Topbar';
import { useNurseWallet } from '../../hooks/useNurseWallet';

const Revenue = () => {
  const { wallet, isLoading, error, isProcessingTopUp, reload, createTopUpLink } = useNurseWallet();
  const [topupAmount, setTopupAmount] = useState('100000');

  const formatVND = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const handleTopUp = async () => {
    await createTopUpLink(Number(topupAmount), 'TOPUP_WALLET');
  };

  return (
    <div className="pb-10">
      <Topbar
        title="Doanh thu & Ví"
        subtitle="Quản lý số dư, tiền ký quỹ và lịch sử giao dịch."
      />

      {error && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-bold text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="relative overflow-hidden border-none bg-grad p-8 text-white shadow-xl lg:col-span-2">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/70">
              <Wallet size={14} /> Số dư khả dụng
            </div>
            <div className="mt-2 text-heading text-5xl font-semibold">
              {isLoading ? <Loader2 className="animate-spin" size={36} /> : formatVND(wallet?.balance || 0)}
            </div>

            <div className="mt-8 flex flex-wrap gap-6 border-t border-white/20 pt-6">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Tiền ký quỹ (Pledge)</div>
                <div className="mt-1 flex items-center gap-1.5 text-lg font-bold">
                  <ShieldCheck size={18} className="text-white/80" />
                  {formatVND(wallet?.pledgeAmount || 0)}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Tổng tài sản</div>
                <div className="mt-1 text-lg font-bold">
                  {formatVND((wallet?.balance || 0) + (wallet?.pledgeAmount || 0))}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-none bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-lav-acc">
            <Plus size={16} /> Nạp tiền nhanh
          </div>
          <p className="mb-4 text-xs font-semibold text-text-mid">
            Nạp thêm tiền vào ví để đảm bảo điều kiện nhận đơn tiền mặt (Chiết khấu 10%).
          </p>
          <div className="space-y-4">
            <div className="relative">
              <input
                type="number"
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
                className="w-full rounded-2xl border border-lav-100 bg-lav-50/50 px-4 py-3 font-semibold text-text-dark outline-none focus:border-lav-acc/50"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-light">VND</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {['100000', '200000', '500000', '1000000'].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setTopupAmount(amt)}
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                    topupAmount === amt
                      ? 'border-lav-acc bg-lav-acc/10 text-lav-acc'
                      : 'border-lav-100 text-text-light hover:bg-lav-50'
                  }`}
                >
                  {parseInt(amt, 10) / 1000}k
                </button>
              ))}
            </div>
            <Btn full variant="grad" onClick={handleTopUp} disabled={isProcessingTopUp}>
              <CreditCard size={16} /> {isProcessingTopUp ? 'Đang xử lý...' : 'Nạp qua PayOS'}
            </Btn>
          </div>
        </Card>
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-lav-acc/20 bg-lav-acc/5 p-4 text-sm font-bold text-lav-acc">
        <AlertCircle size={18} className="mt-0.5 shrink-0" />
        <p>
          Đối với đơn thanh toán bằng tiền mặt, hệ thống khấu trừ 10% hoa hồng từ số dư ví khi bạn hoàn thành ca làm.
          Vui lòng duy trì số dư tối thiểu để được ưu tiên nhận đơn.
        </p>
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-heading text-xl font-semibold text-black">
            <History size={20} className="text-lav-acc" /> Lịch sử giao dịch
          </h3>
          <Btn variant="ghost" size="sm" className="text-black/60 hover:text-black" onClick={reload}>
            Làm mới
          </Btn>
        </div>
        <Card className="overflow-hidden border border-lav-200 bg-white p-0 shadow-lg">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="animate-spin text-lav-dark" size={30} />
            </div>
          ) : (wallet?.transactions.length ?? 0) === 0 ? (
            <div className="px-6 py-12 text-center text-sm font-bold text-text-mid">Chưa có giao dịch nào.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-lav-100 bg-lav-50 text-[10px] font-semibold uppercase tracking-widest text-text-light">
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
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                            tx.type === 'TOPUP'
                              ? 'bg-green-500/10 text-green-500'
                              : tx.type === 'COMMISSION'
                                ? 'bg-amber-500/10 text-amber-500'
                                : 'bg-lav-100 text-lav-dark'
                          }`}
                        >
                          {tx.type === 'TOPUP' ? <ArrowUpRight size={10} /> : <ArrowDownLeft size={10} />}
                          {tx.type}
                        </span>
                      </td>
                      <td className={`p-4 text-right font-semibold ${tx.amount > 0 ? 'text-green-500' : 'text-amber-500'}`}>
                        {tx.amount > 0 ? '+' : ''}
                        {formatVND(tx.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Revenue;
