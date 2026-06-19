import { ArrowDownLeft, ArrowUpRight, CheckCircle2, Loader2, RefreshCw, Upload, Wallet as WalletIcon, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getAdminWallet, type AdminWallet } from '../../api/adminWalletApi';
import { withdrawalApi, type WithdrawalRequest } from '../../api/withdrawalApi';
import Card from '../../components/common/Card';
import Topbar from '../../components/layout/Topbar';
import { getApiErrorMessage } from '../../utils/apiError';

const transactionLabel: Record<string, string> = {
  BOOKING_PAYMENT_RECEIVED: 'Nhận tiền booking',
  NURSE_PAYOUT: 'Chi trả nurse',
  BOOKING_REFUND: 'Hoàn tiền mother',
};

const statusLabel: Record<string, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Đã từ chối',
  CANCELLED: 'Đã hủy',
};

const formatVnd = (value?: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value ?? 0));

const formatDate = (value?: string) => {
  if (!value) return '--';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
};

const AdminWalletPage = () => {
  const [wallet, setWallet] = useState<AdminWallet | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [bankTransactionCode, setBankTransactionCode] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [evidence, setEvidence] = useState<File | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [walletData, withdrawalPage] = await Promise.all([
        getAdminWallet(),
        withdrawalApi.getAdminRequests(),
      ]);
      setWallet(walletData);
      setWithdrawals(withdrawalPage.content ?? []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không tải được dữ liệu ví nền tảng.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const approveWithdrawal = async (requestId: string) => {
    setIsProcessing(true);
    setError('');
    setSuccess('');
    try {
      await withdrawalApi.approve(requestId, { bankTransactionCode, adminNote, evidence });
      setBankTransactionCode('');
      setAdminNote('');
      setEvidence(null);
      setSuccess('Đã duyệt yêu cầu rút tiền.');
      await loadData();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể duyệt yêu cầu rút tiền.'));
    } finally {
      setIsProcessing(false);
    }
  };

  const rejectWithdrawal = async (requestId: string) => {
    setIsProcessing(true);
    setError('');
    setSuccess('');
    try {
      await withdrawalApi.reject(requestId, rejectReason);
      setRejectReason('');
      setSuccess('Đã từ chối yêu cầu rút tiền và hoàn tiền cho nurse.');
      await loadData();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể từ chối yêu cầu rút tiền.'));
    } finally {
      setIsProcessing(false);
    }
  };

  const transactions = wallet?.transactions?.content ?? [];
  const pendingWithdrawals = withdrawals.filter((item) => item.status === 'PENDING');

  return (
    <>
      <Topbar
        title="Ví nền tảng"
        subtitle="Theo dõi dòng tiền app thu từ booking, chi trả cho nurse và xử lý rút tiền thủ công."
      />

      {isLoading ? (
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="animate-spin text-lav-dark" size={36} />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
          <div className="font-black text-red-600">{error}</div>
          <button onClick={loadData} className="mt-4 text-sm font-bold text-red-700 underline">Thử lại</button>
        </div>
      ) : (
        <div className="space-y-6">
          {success && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{success}</div>}

          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="border-none bg-grad p-6 text-white shadow-xl lg:col-span-2">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-white/70">
                    <WalletIcon size={16} /> Số dư ví admin
                  </div>
                  <div className="mt-3 font-serif text-4xl font-black">{formatVnd(wallet?.balance)}</div>
                  <div className="mt-3 text-xs font-semibold text-white/70">Cập nhật: {formatDate(wallet?.updatedAt)}</div>
                </div>
                <button
                  type="button"
                  onClick={loadData}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white transition hover:bg-white/25"
                  aria-label="Làm mới ví nền tảng"
                >
                  <RefreshCw size={18} />
                </button>
              </div>
            </Card>

            <Card className="p-6">
              <div className="text-xs font-black uppercase tracking-wider text-text-light">Yêu cầu rút chờ duyệt</div>
              <div className="mt-2 text-3xl font-black text-text-dark">{pendingWithdrawals.length}</div>
              <div className="mt-2 text-sm font-semibold text-text-mid">Admin chuyển khoản ngoài app rồi upload bằng chứng.</div>
            </Card>
          </div>

          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <div className="font-serif text-xl font-black text-text-dark">Yêu cầu rút tiền của nurse</div>
                <div className="mt-1 text-sm font-semibold text-text-light">Duyệt sau khi đã chuyển khoản ngân hàng thực tế.</div>
              </div>
              <button onClick={loadData} className="text-sm font-black text-lav-acc">Làm mới</button>
            </div>

            <div className="space-y-4">
              {withdrawals.map((item) => (
                <div key={item.id} className="rounded-2xl border border-lav-100 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="font-black text-text-dark">{item.nurseName} - {formatVnd(item.amount)}</div>
                      <div className="mt-1 text-sm font-semibold text-text-mid">
                        {item.bankName} - {item.bankAccountNumber} - {item.bankAccountHolder}
                      </div>
                    </div>
                    <span className="rounded-full bg-lav-50 px-3 py-1 text-xs font-black text-lav-dark">{statusLabel[item.status] ?? item.status}</span>
                  </div>

                  {item.status === 'PENDING' && (
                    <div className="mt-4 grid gap-3 lg:grid-cols-5">
                      <input className="rounded-xl border border-lav-100 px-3 py-2 text-sm font-bold outline-none focus:border-lav-acc lg:col-span-1" placeholder="Mã giao dịch bank" value={bankTransactionCode} onChange={(e) => setBankTransactionCode(e.target.value)} />
                      <input className="rounded-xl border border-lav-100 px-3 py-2 text-sm font-bold outline-none focus:border-lav-acc lg:col-span-1" placeholder="Ghi chú duyệt" value={adminNote} onChange={(e) => setAdminNote(e.target.value)} />
                      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-lav-100 px-3 py-2 text-sm font-black text-lav-acc">
                        <Upload size={15} />
                        {evidence ? evidence.name : 'Ảnh chuyển khoản'}
                        <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => setEvidence(e.target.files?.[0] ?? null)} />
                      </label>
                      <button disabled={isProcessing || !evidence} onClick={() => approveWithdrawal(item.id)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-black text-white disabled:opacity-60">
                        <CheckCircle2 size={16} /> Duyệt
                      </button>
                      <div className="flex gap-2">
                        <input className="min-w-0 flex-1 rounded-xl border border-lav-100 px-3 py-2 text-sm font-bold outline-none focus:border-lav-acc" placeholder="Lý do từ chối" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
                        <button disabled={isProcessing || !rejectReason.trim()} onClick={() => rejectWithdrawal(item.id)} className="inline-flex items-center justify-center gap-1 rounded-xl bg-rose-500 px-3 py-2 text-sm font-black text-white disabled:opacity-60">
                          <XCircle size={15} /> Từ chối
                        </button>
                      </div>
                    </div>
                  )}

                  {item.transferEvidenceUrl && (
                    <a className="mt-3 inline-block text-xs font-black text-lav-acc underline" href={item.transferEvidenceUrl} target="_blank" rel="noreferrer">
                      Xem bằng chứng chuyển khoản
                    </a>
                  )}
                </div>
              ))}
              {!withdrawals.length && <div className="text-center text-sm font-bold text-text-light">Chưa có yêu cầu rút tiền.</div>}
            </div>
          </Card>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-lav-100 px-6 py-5">
              <div className="font-serif text-xl font-black text-text-dark">Lịch sử ví admin</div>
              <div className="mt-1 text-sm font-semibold text-text-light">Dòng dương là tiền app nhận, dòng âm là tiền chi trả cho nurse.</div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-lav-100 bg-lav-50 text-[11px] font-black uppercase tracking-widest text-text-light">
                    <th className="px-5 py-4">Thời gian</th>
                    <th className="px-5 py-4">Booking</th>
                    <th className="px-5 py-4">Loại</th>
                    <th className="px-5 py-4 text-right">Tác động ví</th>
                    <th className="px-5 py-4 text-right">Số dư sau</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-lav-50">
                  {transactions.map((transaction) => {
                    const impact = Number(transaction.walletImpact ?? 0);
                    const isPositive = impact >= 0;
                    return (
                      <tr key={transaction.id} className="transition hover:bg-lav-50/60">
                        <td className="px-5 py-4 text-sm font-semibold text-text-mid">{formatDate(transaction.createdAt)}</td>
                        <td className="px-5 py-4 font-mono text-xs font-bold text-text-light">{transaction.bookingId}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black ${isPositive ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-600'}`}>
                            {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
                            {transactionLabel[transaction.transactionType] ?? transaction.transactionType}
                          </span>
                        </td>
                        <td className={`px-5 py-4 text-right font-black ${isPositive ? 'text-green-600' : 'text-rose-600'}`}>
                          {isPositive ? '+' : ''}{formatVnd(impact)}
                        </td>
                        <td className="px-5 py-4 text-right font-black text-text-dark">{formatVnd(transaction.balanceAfter)}</td>
                      </tr>
                    );
                  })}

                  {!transactions.length && (
                    <tr>
                      <td colSpan={5} className="px-5 py-16 text-center text-sm font-bold text-text-light">Chưa có giao dịch ví admin.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

export default AdminWalletPage;
