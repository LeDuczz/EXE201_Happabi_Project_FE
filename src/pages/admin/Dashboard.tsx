import {
  BarChart3,
  BellRing,
  CalendarClock,
  CreditCard,
  Loader2,
  MessageSquareText,
  RefreshCw,
  ShieldAlert,
  Star,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  getAdminOperationsDashboard,
  type AdminDashboardDailyMetric,
  type AdminDashboardFinancialDailyMetric,
  type AdminDashboardRiskAlert,
  type AdminOperationsDashboard,
} from '../../api/adminDashboardApi';
import Card from '../../components/common/Card';
import Topbar from '../../components/layout/Topbar';
import { getApiErrorMessage } from '../../utils/apiError';

const formatNumber = (value?: number) => new Intl.NumberFormat('vi-VN').format(Number(value ?? 0));

const formatVnd = (value?: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(value ?? 0));

const formatCompactVnd = (value: number) => {
  const absoluteValue = Math.abs(value);
  if (absoluteValue >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (absoluteValue >= 1_000) return `${Math.round(value / 1_000)}K`;
  return `${Math.round(value)}`;
};

const formatDateTime = (value?: string) => {
  if (!value) return '--';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
};

const categoryLabel: Record<string, string> = {
  APP_EXPERIENCE: 'Trải nghiệm app',
  BOOKING: 'Đặt lịch',
  PAYMENT: 'Thanh toán',
  CHAT_AI: 'Chat & AI',
  NURSE_ONBOARDING: 'Hồ sơ nurse',
  DOCTOR_REVIEW: 'Duyệt hồ sơ',
  SUGGESTION: 'Đề xuất',
  OTHER: 'Khác',
};

const severityText: Record<string, string> = {
  HIGH: 'Ưu tiên cao',
  MEDIUM: 'Cần xử lý',
  LOW: 'Theo dõi',
};

const riskAlertTitleMap: Record<string, string> = {
  'Work session incidents need review': 'Sự cố ca làm cần kiểm tra',
  'Refund requests need payout': 'Yêu cầu hoàn tiền cần xử lý',
  'Nurse withdrawals need payout': 'Yêu cầu rút tiền cần chi trả',
  'Nurse profiles need review': 'Hồ sơ nurse cần duyệt',
  'New user feedback': 'Góp ý mới cần phân loại',
  'Knowledge items need review': 'Tri thức AI cần duyệt',
  'Sessions waiting for mother confirmation': 'Ca làm chờ mẹ xác nhận',
  'Nurse penalty watchlist': 'Nurse trong danh sách theo dõi',
};

const riskAlertMessageMap: Record<string, string> = {
  'There are incident reports waiting for admin review.': 'Có báo cáo sự cố đang chờ admin kiểm tra bằng chứng.',
  'Mother refund requests are waiting for manual transfer evidence.': 'Có yêu cầu hoàn tiền cần chuyển khoản thủ công và tải bằng chứng.',
  'Nurse withdrawal requests are waiting for admin bank transfer.': 'Có yêu cầu rút tiền của nurse đang chờ admin chuyển khoản ngân hàng.',
  'Nurse onboarding profiles are waiting for verification.': 'Có hồ sơ nurse đang chờ xác minh và duyệt onboarding.',
  'Fresh product feedback is waiting for triage.': 'Có góp ý mới từ người dùng cần phân loại và phản hồi.',
  'AI knowledge items are waiting for admin approval before indexing.': 'Có tri thức AI đang chờ admin duyệt trước khi đưa vào chatbot.',
  'Completed sessions are waiting for mother confirmation or auto-confirm.': 'Có ca đã checkout đang chờ mẹ xác nhận hoặc hệ thống tự xác nhận.',
  'Some nurses currently have violations or booking suspension history.': 'Một số nurse đang có vi phạm hoặc lịch sử tạm khóa nhận lịch.',
};

const translateRiskAlertTitle = (title: string) => riskAlertTitleMap[title] ?? title;

const translateRiskAlertMessage = (message: string) => riskAlertMessageMap[message] ?? message;

const AdminDashboard = () => {
  const [dashboard, setDashboard] = useState<AdminOperationsDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    setIsLoading(true);
    setError('');
    try {
      setDashboard(await getAdminOperationsDashboard());
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không tải được dữ liệu tổng quan vận hành.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  return (
    <>
      <Topbar
        title="Operations Dashboard"
        subtitle="Theo dõi GMV, booking, payout, nguồn cung nurse và các việc admin cần xử lý."
      />

      {isLoading ? (
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="animate-spin text-lav-dark" size={40} />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-10 text-center">
          <div className="font-semibold text-red-600">{error}</div>
          <button onClick={loadDashboard} className="mt-4 text-sm font-bold text-red-700 underline">Thử lại</button>
        </div>
      ) : dashboard ? (
        <div className="space-y-6">
          <div className="grid gap-4 xl:grid-cols-4">
            <MetricCard
              icon={<BellRing size={20} />}
              label="Action Queue"
              value={formatNumber(totalActionItems(dashboard))}
              helper="Hồ sơ, payout, refund, sự cố và feedback"
              tone="lavender"
            />
            <MetricCard
              icon={<Wallet size={20} />}
              label="Admin Wallet"
              value={formatVnd(dashboard.financialControl.adminWalletBalance)}
              helper={`Cập nhật ${formatDateTime(dashboard.generatedAt)}`}
              tone="pink"
            />
            <MetricCard
              icon={<CalendarClock size={20} />}
              label="Bookings Today"
              value={formatNumber(dashboard.bookingOperations.todayBookings)}
              helper={`${formatNumber(dashboard.bookingOperations.upcoming24hBookings)} ca trong 24 giờ tới`}
              tone="blue"
            />
            <MetricCard
              icon={<UserCheck size={20} />}
              label="Active Supply"
              value={formatNumber(dashboard.nurseSupplyHealth.availableNurses)}
              helper={`${formatNumber(dashboard.nurseSupplyHealth.activeNurses)} nurse đang hoạt động`}
              tone="green"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
            <Card className="p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-text-dark">Hàng đợi vận hành</h2>
                  <p className="mt-1 text-sm font-semibold text-text-light">Các mục admin nên xử lý trước để flow không bị nghẽn.</p>
                </div>
                <button
                  type="button"
                  onClick={loadDashboard}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-lav-50 text-lav-dark transition hover:bg-lav-100"
                  aria-label="Làm mới dashboard"
                >
                  <RefreshCw size={18} />
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <ActionItem label="Hồ sơ nurse chờ duyệt" value={dashboard.actionQueue.pendingNurseProfiles} to="/admin/users" />
                <ActionItem label="Yêu cầu rút tiền" value={dashboard.actionQueue.pendingWithdrawals} to="/admin/wallet" />
                <ActionItem label="Yêu cầu hoàn tiền" value={dashboard.actionQueue.pendingRefunds} to="/admin/wallet" />
                <ActionItem label="Sự cố ca làm" value={dashboard.actionQueue.pendingIncidents} to="/admin/incidents" />
                <ActionItem label="Góp ý mới" value={dashboard.actionQueue.newFeedbacks} to="/admin/feedbacks" />
                <ActionItem label="Tri thức AI chờ duyệt" value={dashboard.actionQueue.pendingKnowledgeItems} to="/admin/knowledge" />
                <ActionItem label="Chờ mẹ xác nhận ca" value={dashboard.actionQueue.waitingMotherConfirmations} to="/admin/incidents" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={20} className="text-rose-500" />
                  <h2 className="text-lg font-black text-text-dark">Risk Alerts</h2>
                </div>
                <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-black text-rose-600">
                  {formatNumber(dashboard.riskAlerts.length)} cảnh báo
                </span>
              </div>
              <div className="space-y-3">
                {dashboard.riskAlerts.map((alert) => (
                  <RiskAlertItem key={`${alert.title}-${alert.targetPath}`} alert={alert} />
                ))}
                {!dashboard.riskAlerts.length && (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
                    Không có cảnh báo cần xử lý ngay. Hệ thống đang ổn định.
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <Card className="p-6">
              <SectionHeader icon={<CalendarClock size={18} />} title="Booking Operations" />
              <StatRows
                rows={[
                  ['Đã thanh toán hôm nay', dashboard.bookingOperations.paidBookingsToday],
                  ['Chờ thanh toán', dashboard.bookingOperations.pendingPaymentBookings],
                  ['Đang diễn ra', dashboard.bookingOperations.inProgressSessions],
                  ['Chờ check-in', dashboard.bookingOperations.waitingCheckInSessions],
                  ['Ca bị report', dashboard.bookingOperations.reportedSessions],
                  ['Đã hủy hôm nay', dashboard.bookingOperations.cancelledBookingsToday],
                ]}
              />
            </Card>

            <Card className="p-6">
              <SectionHeader icon={<CreditCard size={18} />} title="Revenue Operations" />
              <StatRows
                money
                rows={[
                  ['GMV Today', dashboard.financialControl.todayGrossMerchandiseValue],
                  ['GMV 7D', dashboard.financialControl.last7DaysGrossMerchandiseValue],
                  ['GMV 30D', dashboard.financialControl.last30DaysGrossMerchandiseValue],
                  ['Payment Volume 30D', dashboard.financialControl.last30DaysAppPayments],
                  ['Platform Revenue 30D', dashboard.financialControl.last30DaysPlatformRevenue],
                  ['Payment Processing Fees 30D', dashboard.financialControl.last30DaysPaymentGatewayFees],
                  ['Pending Payout', dashboard.financialControl.pendingWithdrawalAmount],
                  ['Refund Exposure', dashboard.financialControl.pendingRefundAmount],
                ]}
              />
            </Card>

            <Card className="p-6">
              <SectionHeader icon={<Users size={18} />} title="Supply Health" />
              <StatRows
                rows={[
                  ['Tổng nurse', dashboard.nurseSupplyHealth.totalNurses],
                  ['Đang hoạt động', dashboard.nurseSupplyHealth.activeNurses],
                  ['Đang bận', dashboard.nurseSupplyHealth.busyNurses],
                  ['Tạm nghỉ', dashboard.nurseSupplyHealth.offlineNurses],
                  ['Chờ ký hợp đồng', dashboard.nurseSupplyHealth.pendingContractNurses],
                  ['Chờ ký quỹ', dashboard.nurseSupplyHealth.pendingDepositNurses],
                  ['Đang bị phạt', dashboard.nurseSupplyHealth.penalizedNurses],
                ]}
              />
            </Card>
          </div>

          <Card className="p-6">
            <div className="flex flex-col gap-3 border-b border-lav-100 pb-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <SectionHeader icon={<TrendingUp size={18} />} title="Financial Performance" />
                <p className="mt-1 text-sm font-semibold text-text-light">
                  Theo dõi GMV, doanh thu nền tảng, phí xử lý thanh toán và phần doanh thu ròng trong 30 ngày.
                </p>
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-text-light">30 ngày gần nhất</span>
            </div>

            <div className="grid divide-y divide-lav-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-6">
              <FinancialKpi
                label="GMV"
                value={dashboard.financialControl.last30DaysGrossMerchandiseValue}
                helper="Tổng tiền nhận qua app"
                tone="lavender"
              />
              <FinancialKpi
                label="Payment Volume"
                value={dashboard.financialControl.last30DaysAppPayments}
                helper="Customer payments received via app"
                tone="blue"
              />
              <FinancialKpi
                label="Platform Revenue"
                value={dashboard.financialControl.last30DaysPlatformRevenue}
                helper="15% booking đã hoàn tất"
                tone="green"
              />
              <FinancialKpi
                label="Payment Processing Fees"
                value={dashboard.financialControl.last30DaysPaymentGatewayFees}
                helper="Chi phí bên thứ ba (PayOS)"
                tone="rose"
              />
              <FinancialKpi
                label="Nurse Payouts"
                value={dashboard.financialControl.last30DaysNursePayouts}
                helper="Tiền đã phân bổ vào ví nurse"
                tone="amber"
              />
              <FinancialKpi
                label="Net Cash Contribution"
                value={dashboard.financialControl.last30DaysNetCashContribution}
                helper="Doanh thu nền tảng sau phí PayOS"
                tone="blue"
              />
            </div>

            <FinancialBreakdownChart
              platformRevenue={dashboard.financialControl.last30DaysPlatformRevenue}
              paymentGatewayFees={dashboard.financialControl.last30DaysPaymentGatewayFees}
              netCashContribution={dashboard.financialControl.last30DaysNetCashContribution}
            />
          </Card>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <Card className="p-6">
              <div className="mb-6 flex items-center justify-between [&>span]:hidden">
                <div>
                  <SectionHeader icon={<BarChart3 size={18} />} title="GMV Trend (30D)" />
                  <p className="mt-1 text-xs font-semibold text-text-light">Theo giá trị booking đã thanh toán, không lấy từ ví admin.</p>
                </div>
                <span className="text-xs font-black text-text-light">Theo ví admin</span>
              </div>
              <GmvTrendChart data={dashboard.gmvTrend} />
              {!dashboard.gmvTrend.some((item) => item.value > 0) && (
                <div className="mt-4 text-center text-sm font-bold text-text-light">Chưa có GMV booking trong 30 ngày qua.</div>
              )}
            </Card>

            <Card className="p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <SectionHeader icon={<MessageSquareText size={18} />} title="Voice of Customer" />
                <Link to="/admin/feedbacks" className="text-sm font-black text-lav-acc">Xem tất cả</Link>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-3">
                <MiniBox label="Mới" value={dashboard.feedbackInsight.newFeedbacks} />
                <MiniBox label="Đang xem xét" value={dashboard.feedbackInsight.reviewingFeedbacks} />
                <MiniBox label="Đã lên kế hoạch" value={dashboard.feedbackInsight.plannedFeedbacks} />
                <MiniBox label="CSAT" value={`${Number(dashboard.feedbackInsight.averageRating).toFixed(1)}/5`} />
              </div>

              <div className="space-y-3">
                {dashboard.feedbackInsight.latestFeedbacks.map((feedback) => (
                  <div key={feedback.id} className="rounded-2xl border border-lav-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-black text-text-dark">{feedback.title}</div>
                        <div className="mt-1 text-xs font-bold text-text-light">
                          {feedback.submittedByName} · {categoryLabel[feedback.category] ?? feedback.category}
                        </div>
                      </div>
                      {feedback.rating && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-black text-amber-600">
                          <Star size={12} /> {feedback.rating}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {!dashboard.feedbackInsight.latestFeedbacks.length && (
                  <div className="rounded-2xl border border-lav-100 p-5 text-center text-sm font-bold text-text-light">
                    Chưa có góp ý người dùng.
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      ) : null}
    </>
  );
};

const totalActionItems = (dashboard: AdminOperationsDashboard) =>
  dashboard.actionQueue.pendingNurseProfiles +
  dashboard.actionQueue.pendingWithdrawals +
  dashboard.actionQueue.pendingRefunds +
  dashboard.actionQueue.pendingIncidents +
  dashboard.actionQueue.newFeedbacks +
  dashboard.actionQueue.pendingKnowledgeItems +
  dashboard.actionQueue.waitingMotherConfirmations;

const MetricCard = ({
  icon,
  label,
  value,
  helper,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  helper: string;
  tone: 'lavender' | 'pink' | 'blue' | 'green';
}) => {
  const toneClass = {
    lavender: 'bg-lav-50 text-lav-dark',
    pink: 'bg-pink-50 text-pink-600',
    blue: 'bg-sky-50 text-sky-600',
    green: 'bg-emerald-50 text-emerald-600',
  }[tone];

  return (
    <Card className="p-5">
      <div className="flex items-start gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${toneClass}`}>{icon}</div>
        <div className="min-w-0">
          <div className="text-xs font-black uppercase tracking-wider text-text-light">{label}</div>
          <div className="mt-1 truncate text-2xl font-black text-text-dark">{value}</div>
          <div className="mt-1 text-xs font-bold text-text-mid">{helper}</div>
        </div>
      </div>
    </Card>
  );
};

const ActionItem = ({ label, value, to }: { label: string; value: number; to: string }) => (
  <Link
    to={to}
    className="group flex items-center justify-between gap-4 rounded-2xl border border-lav-100 bg-white p-4 transition hover:border-lav-300 hover:bg-lav-50"
  >
    <div>
      <div className="text-sm font-black text-text-dark">{label}</div>
      <div className="mt-1 text-xs font-bold text-text-light">Nhấn để mở màn xử lý</div>
    </div>
    <div className={`rounded-2xl px-3 py-2 text-lg font-black ${value > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
      {formatNumber(value)}
    </div>
  </Link>
);

const RiskAlertItem = ({ alert }: { alert: AdminDashboardRiskAlert }) => {
  const toneClass = {
    HIGH: 'border-rose-200 bg-rose-50/80 text-rose-700 before:bg-rose-500',
    MEDIUM: 'border-amber-200 bg-amber-50/80 text-amber-700 before:bg-amber-500',
    LOW: 'border-sky-200 bg-sky-50/80 text-sky-700 before:bg-sky-500',
  }[alert.severity] ?? 'border-sky-200 bg-sky-50/80 text-sky-700 before:bg-sky-500';

  return (
    <Link
      to={alert.targetPath}
      className={`relative block overflow-hidden rounded-2xl border p-4 pl-5 transition before:absolute before:left-0 before:top-0 before:h-full before:w-1 hover:-translate-y-0.5 hover:shadow-sm ${toneClass}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-black uppercase tracking-wider opacity-70">{severityText[alert.severity] ?? 'Theo dõi'}</div>
          <div className="mt-1 font-black text-text-dark">{translateRiskAlertTitle(alert.title)}</div>
          <div className="mt-1 text-sm font-semibold leading-5 opacity-80">{translateRiskAlertMessage(alert.message)}</div>
        </div>
        <div className="shrink-0 rounded-full bg-white px-3 py-1 text-sm font-black shadow-sm">{formatNumber(alert.count)}</div>
      </div>
    </Link>
  );
};

const SectionHeader = ({ icon, title }: { icon: ReactNode; title: string }) => (
  <div className="flex items-center gap-2">
    <div className="text-lav-dark">{icon}</div>
    <h2 className="font-black text-text-dark">{title}</h2>
  </div>
);

const StatRows = ({ rows, money = false }: { rows: Array<[string, number]>; money?: boolean }) => (
  <div className="mt-5 space-y-3">
    {rows.map(([label, value]) => (
      <div key={label} className="flex items-center justify-between gap-4 rounded-xl bg-lav-50 px-4 py-3">
        <span className="text-sm font-bold text-text-mid">{label}</span>
        <span className="text-sm font-black text-text-dark">{money ? formatVnd(value) : formatNumber(value)}</span>
      </div>
    ))}
  </div>
);

const MiniBox = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded-2xl border border-lav-100 bg-lav-50 p-3">
    <div className="text-xs font-black uppercase text-text-light">{label}</div>
    <div className="mt-1 text-lg font-black text-text-dark">{value}</div>
  </div>
);

const FinancialKpi = ({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: number;
  helper: string;
  tone: 'lavender' | 'green' | 'rose' | 'amber' | 'blue';
}) => {
  const helperText: Record<string, string> = {
    GMV: 'Tổng giá trị các booking đã thanh toán',
    'Payment Volume': 'Tổng tiền khách đã thanh toán qua app',
    'Platform Revenue': '15% từ các booking đã hoàn thành',
    'Payment Processing Fees': 'Phí bên thứ ba PayOS đã phát sinh',
    'Nurse Payouts': 'Tiền đã phân bổ vào ví điều dưỡng',
    'Net Cash Contribution': 'Doanh thu đã ghi nhận trừ phí PayOS',
  };
  const toneClass = {
    lavender: 'text-lav-dark',
    green: 'text-emerald-600',
    rose: 'text-rose-600',
    amber: 'text-amber-600',
    blue: 'text-sky-600',
  }[tone];

  return (
    <div className="min-w-0 px-4 py-5 first:pl-0 last:pr-0 sm:px-5">
      <div className="text-[11px] font-black uppercase tracking-wider text-text-light">{label}</div>
      <div className={`mt-2 truncate text-xl font-black ${toneClass}`}>{formatVnd(value)}</div>
      <div className="mt-1 text-xs font-semibold text-text-mid">{helperText[label] ?? helper}</div>
    </div>
  );
};

const FinancialBreakdownChart = ({
  platformRevenue,
  paymentGatewayFees,
  netCashContribution,
}: {
  platformRevenue: number;
  paymentGatewayFees: number;
  netCashContribution: number;
}) => {
  const rows = [
    { label: 'Doanh thu nền tảng đã ghi nhận', value: platformRevenue, color: 'bg-emerald-500', textColor: 'text-emerald-700' },
    { label: 'Phí xử lý thanh toán PayOS', value: paymentGatewayFees, color: 'bg-rose-500', textColor: 'text-rose-700' },
    { label: 'Đóng góp tiền ròng', value: netCashContribution, color: 'bg-sky-500', textColor: 'text-sky-700' },
  ];
  const maximumValue = Math.max(1, ...rows.map((row) => Math.abs(row.value)));

  return (
    <div className="mt-6 rounded-2xl border border-lav-100 bg-lav-50/50 p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="font-black text-text-dark">Phân rã dòng tiền nền tảng</div>
        <div className="text-xs font-semibold text-text-light">Doanh thu đã ghi nhận trừ phí cổng thanh toán trong kỳ</div>
      </div>
      <div className="space-y-4">
        {rows.map((row) => (
          <div key={row.label} className="grid gap-2 sm:grid-cols-[180px_1fr_112px] sm:items-center">
            <div className="text-sm font-bold text-text-mid">{row.label}</div>
            <div className="h-3 overflow-hidden rounded-full bg-white ring-1 ring-lav-100">
              <div
                className={`h-full rounded-full ${row.color} transition-all duration-500`}
                style={{ width: `${(Math.abs(row.value) / maximumValue) * 100}%` }}
              />
            </div>
            <div className={`text-right text-sm font-black ${row.textColor}`}>{formatVnd(row.value)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const GmvTrendChart = ({ data }: { data: AdminDashboardDailyMetric[] }) => {
  const chartData = data.slice(-30);
  const maximumValue = Math.max(1, ...chartData.map((item) => item.value));
  const hasData = chartData.some((item) => item.value > 0);
  const width = 760;
  const height = 240;
  const padding = { top: 18, right: 16, bottom: 34, left: 52 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const barGap = 5;
  const barWidth = Math.max(5, (innerWidth - Math.max(0, chartData.length - 1) * barGap) / Math.max(1, chartData.length));
  const x = (index: number) => padding.left + index * (barWidth + barGap);
  const y = (value: number) => padding.top + innerHeight - (value / maximumValue) * innerHeight;
  const formatDate = (value: string) => new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' })
    .format(new Date(`${value}T00:00:00`));

  return (
    <div className="h-[260px] overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full min-w-[680px] w-full" role="img" aria-label="GMV trend for paid bookings in the last 30 days">
        {[0, 0.5, 1].map((ratio) => {
          const value = maximumValue * ratio;
          const axisY = y(value);
          return (
            <g key={ratio}>
              <line x1={padding.left} x2={width - padding.right} y1={axisY} y2={axisY} stroke="#e9e0f3" strokeDasharray="4 5" />
              <text x={padding.left - 8} y={axisY + 4} textAnchor="end" fill="#9a89ac" fontSize="10" fontWeight="700">
                {formatCompactVnd(value)}
              </text>
            </g>
          );
        })}
        {chartData.map((item, index) => {
          const barHeight = item.value > 0 ? Math.max(3, (item.value / maximumValue) * innerHeight) : 0;
          const shouldShowLabel = index === 0 || index === chartData.length - 1 || index % 7 === 0 || item.value > 0;
          return (
            <g key={item.date}>
              {barHeight > 0 && (
                <>
                  <rect x={x(index)} y={y(item.value)} width={barWidth} height={barHeight} rx="4" fill="url(#gmvGradient)">
                    <title>{`${formatDate(item.date)}: ${formatVnd(item.value)}`}</title>
                  </rect>
                  <text x={x(index) + barWidth / 2} y={Math.max(12, y(item.value) - 6)} textAnchor="middle" fill="#7c3aed" fontSize="10" fontWeight="800">
                    {formatCompactVnd(item.value)}
                  </text>
                </>
              )}
              {shouldShowLabel && (
                <text x={x(index) + barWidth / 2} y={height - 9} textAnchor="middle" fill="#9a89ac" fontSize="10" fontWeight="700">
                  {formatDate(item.date)}
                </text>
              )}
            </g>
          );
        })}
        <defs>
          <linearGradient id="gmvGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#fb7185" />
          </linearGradient>
        </defs>
      </svg>
      {!hasData && <div className="-mt-32 text-center text-sm font-bold text-text-light">No paid booking GMV in the last 30 days.</div>}
    </div>
  );
};

export const FinancialTrendChart = ({ data }: { data: AdminDashboardFinancialDailyMetric[] }) => {
  const chartData = data.slice(-30);
  const values = chartData.flatMap((item) => [
    item.platformRevenue,
    item.paymentGatewayFee,
    Math.max(0, item.netPlatformRevenue),
  ]);
  const maximumValue = Math.max(1, ...values);
  const width = 800;
  const height = 250;
  const padding = { top: 18, right: 18, bottom: 30, left: 48 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const x = (index: number) => padding.left + (chartData.length <= 1 ? innerWidth / 2 : (index / (chartData.length - 1)) * innerWidth);
  const y = (value: number) => padding.top + innerHeight - (Math.max(0, value) / maximumValue) * innerHeight;
  const line = (selector: (item: AdminDashboardFinancialDailyMetric) => number) => chartData
    .map((item, index) => `${x(index)},${y(selector(item))}`)
    .join(' ');
  const hasData = values.some((value) => value > 0);

  return (
    <div className="mt-6">
      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-bold text-text-mid">
        <ChartLegend color="bg-emerald-500" label="Platform Revenue" />
        <ChartLegend color="bg-rose-500" label="Payment Processing Fees" />
        <ChartLegend color="bg-sky-500" label="Net Platform Revenue" />
      </div>
      <div className="h-[250px] overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-full min-w-[640px] w-full" role="img" aria-label="Biểu đồ doanh thu nền tảng và phí PayOS trong 30 ngày">
          {[0, 0.5, 1].map((ratio) => {
            const axisValue = maximumValue * ratio;
            const axisY = y(axisValue);
            return (
              <g key={ratio}>
                <line x1={padding.left} x2={width - padding.right} y1={axisY} y2={axisY} stroke="#eee7f7" strokeDasharray="4 5" />
                <text x={padding.left - 8} y={axisY + 4} textAnchor="end" fill="#a99ab8" fontSize="10" fontWeight="700">
                  {formatCompactVnd(axisValue)}
                </text>
              </g>
            );
          })}
          {hasData && (
            <>
              <polyline points={line((item) => item.platformRevenue)} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points={line((item) => item.paymentGatewayFee)} fill="none" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points={line((item) => item.netPlatformRevenue)} fill="none" stroke="#0ea5e9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </>
          )}
          {chartData.map((item, index) => {
            const shouldShowLabel = index === 0 || index === chartData.length - 1 || index % 7 === 0;
            return shouldShowLabel ? (
              <text key={item.date} x={x(index)} y={height - 8} textAnchor="middle" fill="#a99ab8" fontSize="10" fontWeight="700">
                {new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(new Date(`${item.date}T00:00:00`))}
              </text>
            ) : null;
          })}
        </svg>
      </div>
      {!hasData && (
        <div className="-mt-28 text-center text-sm font-bold text-text-light">Chưa có dữ liệu doanh thu, phí PayOS hoặc phân bổ hoàn tất trong 30 ngày qua.</div>
      )}
    </div>
  );
};

const ChartLegend = ({ color, label }: { color: string; label: string }) => (
  <span className="inline-flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${color}`} />{label}</span>
);

export default AdminDashboard;
