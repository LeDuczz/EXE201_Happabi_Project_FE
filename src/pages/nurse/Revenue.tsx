import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CreditCard,
  History,
  Landmark,
  Loader2,
  Plus,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import Card from '../../components/common/Card';
import Btn from '../../components/common/Btn';
import Topbar from '../../components/layout/Topbar';
import { useNurseWallet } from '../../hooks/useNurseWallet';
import { withdrawalApi, type WithdrawalRequest } from '../../api/withdrawalApi';
import { getApiErrorMessage } from '../../utils/apiError';

interface NurseBankAccount {
  id: string;
  nurseProfileId?: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  status: 'ACTIVE' | 'INACTIVE';
}

const formatVND = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);

const transactionTypeLabel = (type: string) => {
  if (type === 'BOOKING_EARNING') return 'THU NHẬP';
  if (type === 'TOPUP' || type === 'TOPUP_WALLET') return 'NẠP VÍ';
  if (type === 'TOPUP_DEPOSIT') return 'NẠP KÝ QUỸ';
  if (type === 'FEE_DEDUCTION' || type === 'COMMISSION') return 'KHẤU TRỪ';
  if (type === 'PAYOUT' || type === 'WITHDRAW') return 'RÚT TIỀN';
  return 'GIAO DỊCH';
};

const transactionTypeClass = (type: string) => {
  if (type === 'BOOKING_EARNING') return 'bg-emerald-500/10 text-emerald-600';
  if (type === 'FEE_DEDUCTION' || type === 'COMMISSION') return 'bg-amber-500/10 text-amber-500';
  if (type === 'PAYOUT' || type === 'WITHDRAW') return 'bg-lav-100 text-lav-dark';
  return 'bg-green-500/10 text-green-500';
};

const statusLabel = (status: string) => {
  if (status === 'PENDING') return 'Chờ duyệt';
  if (status === 'APPROVED') return 'Đã duyệt';
  if (status === 'REJECTED') return 'Đã từ chối';
  if (status === 'CANCELLED') return 'Đã hủy';
  return status;
};

const Revenue = () => {
  const {
    wallet,
    isLoading: isWalletLoading,
    error: walletError,
    isProcessingTopUp,
    reload: reloadWallet,
    createTopUpLink,
  } = useNurseWallet();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [bankAccount, setBankAccount] = useState<NurseBankAccount | null>(null);
  const [isWithdrawalLoading, setWithdrawalLoading] = useState(true);
  const [isProcessingWithdrawal, setProcessingWithdrawal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [topupAmount, setTopupAmount] = useState('100000');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountHolder, setBankAccountHolder] = useState('');

  const applyBankAccount = (next: NurseBankAccount | null) => {
    setBankAccount(next);
    setBankName(next?.bankName ?? '');
    setBankAccountNumber(next?.bankAccountNumber ?? '');
    setBankAccountHolder(next?.bankAccountHolder ?? '');
  };

  const loadWithdrawalData = useCallback(async () => {
    setWithdrawalLoading(true);
    setError('');
    try {
      const [withdrawalPage, bank] = await Promise.all([
        withdrawalApi.getMyRequests(),
        withdrawalApi.getMyBankAccount(),
      ]);
      setWithdrawals((withdrawalPage.content ?? []).slice(0, 5));
      applyBankAccount(bank);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không tải được dữ liệu rút tiền.'));
    } finally {
      setWithdrawalLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWithdrawalData();
  }, [loadWithdrawalData]);

  useEffect(() => {
    setError(walletError);
  }, [walletError]);

  const refreshAll = async () => {
    await Promise.all([reloadWallet(), loadWithdrawalData()]);
  };

  const handleTopUp = async () => {
    await createTopUpLink(Number(topupAmount), 'TOPUP_WALLET');
  };

  const handleSaveBankAccount = async () => {
    setProcessingWithdrawal(true);
    setError('');
    setSuccess('');
    try {
      const response = await withdrawalApi.saveMyBankAccount({
        bankName: bankName.trim(),
        bankAccountNumber: bankAccountNumber.trim(),
        bankAccountHolder: bankAccountHolder.trim(),
      });
      applyBankAccount(response.data?.data ?? null);
      setSuccess('Đã lưu tài khoản ngân hàng nhận tiền.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể lưu tài khoản ngân hàng.'));
    } finally {
      setProcessingWithdrawal(false);
    }
  };

  const handleCreateWithdrawal = async () => {
    setProcessingWithdrawal(true);
    setError('');
    setSuccess('');
    try {
      await withdrawalApi.createMyRequest({ amount: Number(withdrawAmount) });
      setWithdrawAmount('');
      setSuccess('Đã tạo yêu cầu rút tiền. Số tiền được giữ cho đến khi admin xử lý.');
      await refreshAll();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tạo yêu cầu rút tiền.'));
    } finally {
      setProcessingWithdrawal(false);
    }
  };

  const handleCancelWithdrawal = async (requestId: string) => {
    setProcessingWithdrawal(true);
    setError('');
    setSuccess('');
    try {
      await withdrawalApi.cancelMyRequest(requestId);
      setSuccess('Đã hủy yêu cầu rút tiền và hoàn tiền về ví.');
      await refreshAll();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể hủy yêu cầu rút tiền.'));
    } finally {
      setProcessingWithdrawal(false);
    }
  };

  const balance = Number(wallet?.balance ?? 0);
  const pledgeAmount = Number(wallet?.pledgeAmount ?? 0);
  const lockedWithdrawalAmount = Number(wallet?.lockedWithdrawalAmount ?? 0);
  const transactions = wallet?.transactions ?? [];
  const isLoading = isWalletLoading || isWithdrawalLoading;
  const canSaveBankAccount = Boolean(bankName.trim() && bankAccountNumber.trim() && bankAccountHolder.trim());
  const canCreateWithdrawal = Boolean(bankAccount) && Boolean(withdrawAmount) && Number(withdrawAmount) >= 1000;

  return (
    <div className="pb-10">
      <Topbar
        title="Doanh thu & Ví"
        subtitle="Quản lý số dư, tài khoản ngân hàng, rút tiền và lịch sử giao dịch."
      />

      {error && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          {success}
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
              {isWalletLoading ? <Loader2 className="animate-spin" size={36} /> : formatVND(balance)}
            </div>

            <div className="mt-8 flex flex-wrap gap-6 border-t border-white/20 pt-6">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Đang chờ rút</div>
                <div className="mt-1 text-lg font-bold">{formatVND(lockedWithdrawalAmount)}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Tiền ký quỹ</div>
                <div className="mt-1 flex items-center gap-1.5 text-lg font-bold">
                  <ShieldCheck size={18} className="text-white/80" />
                  {formatVND(pledgeAmount)}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Tổng tài sản</div>
                <div className="mt-1 text-lg font-bold">
                  {formatVND(balance + pledgeAmount + lockedWithdrawalAmount)}
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
            Nạp thêm tiền vào ví để chủ động xử lý các giao dịch và điều kiện nhận đơn.
          </p>
          <div className="space-y-4">
            <div className="relative">
              <input
                type="number"
                value={topupAmount}
                onChange={(event) => setTopupAmount(event.target.value)}
                className="w-full rounded-2xl border border-lav-100 bg-lav-50/50 px-4 py-3 font-semibold text-text-dark outline-none focus:border-lav-acc/50"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-light">VND</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {['100000', '200000', '500000', '1000000'].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setTopupAmount(amount)}
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                    topupAmount === amount
                      ? 'border-lav-acc bg-lav-acc/10 text-lav-acc'
                      : 'border-lav-100 text-text-light hover:bg-lav-50'
                  }`}
                >
                  {Number(amount) / 1000}k
                </button>
              ))}
            </div>
            <Btn full variant="grad" onClick={handleTopUp} disabled={isProcessingTopUp}>
              {isProcessingTopUp ? <Loader2 className="animate-spin" size={16} /> : <CreditCard size={16} />}
              {isProcessingTopUp ? 'Đang xử lý...' : 'Nạp qua PayOS'}
            </Btn>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="border border-lav-200 bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-center gap-2 text-heading text-xl font-semibold text-black">
            <Landmark size={20} className="text-lav-acc" /> Tài khoản nhận tiền
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="rounded-xl border border-lav-100 px-4 py-3 font-bold outline-none focus:border-lav-acc"
              placeholder="Ngân hàng"
              value={bankName}
              onChange={(event) => setBankName(event.target.value)}
            />
            <input
              className="rounded-xl border border-lav-100 px-4 py-3 font-bold outline-none focus:border-lav-acc"
              placeholder="Số tài khoản"
              value={bankAccountNumber}
              onChange={(event) => setBankAccountNumber(event.target.value)}
            />
            <input
              className="rounded-xl border border-lav-100 px-4 py-3 font-bold outline-none focus:border-lav-acc sm:col-span-2"
              placeholder="Tên chủ tài khoản"
              value={bankAccountHolder}
              onChange={(event) => setBankAccountHolder(event.target.value)}
            />
          </div>
          <Btn
            className="mt-4"
            variant="grad"
            onClick={handleSaveBankAccount}
            disabled={isProcessingWithdrawal || !canSaveBankAccount}
          >
            {isProcessingWithdrawal ? <Loader2 className="animate-spin" size={16} /> : <Landmark size={16} />}
            Lưu tài khoản ngân hàng
          </Btn>
        </Card>

        <Card className="border border-lav-200 bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-center gap-2 text-heading text-xl font-semibold text-black">
            <Banknote size={20} className="text-lav-acc" /> Tạo yêu cầu rút tiền
          </div>
          {!bankAccount && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
              Bạn cần lưu tài khoản ngân hàng trước khi tạo yêu cầu rút tiền.
            </div>
          )}
          {bankAccount && (
            <div className="mb-4 rounded-xl border border-lav-100 bg-lav-50 px-4 py-3 text-sm font-bold text-text-mid">
              Nhận tiền vào: {bankAccount.bankName} - {bankAccount.bankAccountNumber} - {bankAccount.bankAccountHolder}
            </div>
          )}
          <input
            className="rounded-xl border border-lav-100 px-4 py-3 font-bold outline-none focus:border-lav-acc"
            placeholder="Số tiền tối thiểu 1.000 đ"
            type="number"
            min={1000}
            value={withdrawAmount}
            onChange={(event) => setWithdrawAmount(event.target.value)}
          />
          <Btn
            className="mt-4"
            variant="grad"
            onClick={handleCreateWithdrawal}
            disabled={isProcessingWithdrawal || !canCreateWithdrawal}
          >
            {isProcessingWithdrawal ? <Loader2 className="animate-spin" size={16} /> : <Banknote size={16} />}
            Tạo yêu cầu rút
          </Btn>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="border border-lav-200 bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-heading text-xl font-semibold text-black">Yêu cầu rút gần đây</h3>
            <Btn variant="ghost" size="sm" onClick={refreshAll}>
              <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
              Làm mới
            </Btn>
          </div>
          <div className="space-y-3">
            {withdrawals.map((item) => (
              <div key={item.id} className="rounded-xl border border-lav-100 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-black text-text-dark">{formatVND(Number(item.amount))}</div>
                    <div className="text-xs font-bold text-text-light">{item.bankName} - {item.bankAccountNumber}</div>
                  </div>
                  <span className="rounded-full bg-lav-50 px-3 py-1 text-xs font-black text-lav-dark">{statusLabel(item.status)}</span>
                </div>
                {item.status === 'PENDING' && (
                  <button
                    className="mt-3 text-xs font-black text-red-500"
                    onClick={() => handleCancelWithdrawal(item.id)}
                    disabled={isProcessingWithdrawal}
                  >
                    Hủy yêu cầu
                  </button>
                )}
              </div>
            ))}
            {!isWithdrawalLoading && withdrawals.length === 0 && (
              <div className="text-sm font-bold text-text-light">Chưa có yêu cầu rút tiền.</div>
            )}
          </div>
        </Card>

        <div className="flex items-start gap-3 rounded-2xl border border-lav-acc/20 bg-lav-acc/5 p-4 text-sm font-bold text-lav-acc">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>
            Yêu cầu rút tiền sẽ snapshot tài khoản ngân hàng hiện tại, sau đó giữ số dư khả dụng cho đến khi admin
            chuyển khoản và duyệt thủ công.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-heading text-xl font-semibold text-black">
            <History size={20} className="text-lav-acc" /> Lịch sử giao dịch
          </h3>
          <Btn variant="ghost" size="sm" className="text-black/60 hover:text-black" onClick={refreshAll}>
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            Làm mới
          </Btn>
        </div>
        <Card className="overflow-hidden border border-lav-200 bg-white p-0 shadow-lg">
          {isWalletLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="animate-spin text-lav-dark" size={30} />
            </div>
          ) : transactions.length === 0 ? (
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
                  {transactions.map((transaction) => {
                    const amount = Number(transaction.amount ?? 0);
                    return (
                      <tr key={transaction.id} className="transition hover:bg-lav-50/50">
                        <td className="p-4 text-xs font-semibold text-text-light">{transaction.createdAt}</td>
                        <td className="p-4 text-sm font-bold text-text-dark">{transaction.description}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${transactionTypeClass(transaction.type)}`}>
                            {amount >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownLeft size={10} />}
                            {transactionTypeLabel(transaction.type)}
                          </span>
                        </td>
                        <td className={`p-4 text-right font-semibold ${amount >= 0 ? 'text-green-500' : 'text-amber-500'}`}>
                          {amount > 0 ? '+' : ''}
                          {formatVND(amount)}
                        </td>
                      </tr>
                    );
                  })}
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
