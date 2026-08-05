import { CalendarDays, CalendarRange, Eye, Loader2, RefreshCw, Search, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getAdminBookingDetail,
  getAdminBookings,
  type AdminBooking,
  type AdminBookingFilters,
  type AdminBookingPaymentOption,
  type AdminBookingStatus,
} from '../../api/adminBookingApi';
import Card from '../../components/common/Card';
import Pagination from '../../components/common/Pagination';
import Topbar from '../../components/layout/Topbar';
import { getApiErrorMessage } from '../../utils/apiError';

const statusLabel: Record<AdminBookingStatus, string> = {
  PENDING_PAYMENT: 'Chờ thanh toán',
  PENDING_NURSE_ACCEPTANCE: 'Chờ nurse nhận',
  ACCEPTED: 'Đã nhận',
  REJECTED: 'Đã từ chối',
  CANCELLED: 'Đã hủy',
  COMPLETED: 'Hoàn thành',
};

const paymentLabel: Record<AdminBookingPaymentOption, string> = {
  DEPOSIT_30_PERCENT: 'Cọc 30%',
  FULL_APP_PAYMENT: 'Thanh toán 100%',
};

const statusTone: Record<AdminBookingStatus, string> = {
  PENDING_PAYMENT: 'bg-amber-50 text-amber-700 ring-amber-200',
  PENDING_NURSE_ACCEPTANCE: 'bg-violet-50 text-violet-700 ring-violet-200',
  ACCEPTED: 'bg-sky-50 text-sky-700 ring-sky-200',
  REJECTED: 'bg-rose-50 text-rose-700 ring-rose-200',
  CANCELLED: 'bg-slate-50 text-slate-600 ring-slate-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
};

const pageSize = 12;

const formatVnd = (value?: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value ?? 0));

const compactVnd = (value?: number) => {
  const amount = Number(value ?? 0);
  if (amount >= 1_000_000) {
    return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(amount / 1_000_000)}M đ`;
  }
  if (amount >= 1_000) {
    return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(amount / 1_000)}K đ`;
  }
  return formatVnd(amount);
};

const formatDate = (value?: string) => {
  if (!value) return '--';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
};

const shortId = (value?: string) => value ? `${value.slice(0, 8)}...` : '--';

const AdminBookings = () => {
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get('query') ?? '';
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [filters, setFilters] = useState<AdminBookingFilters>({
    query: urlQuery,
    status: '',
    paymentOption: '',
    createdFrom: '',
    createdTo: '',
    serviceFrom: '',
    serviceTo: '',
  });
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadBookings = useCallback(async (nextPage: number, nextFilters: AdminBookingFilters) => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getAdminBookings(nextPage, pageSize, nextFilters);
      setBookings(data?.content ?? []);
      setTotalPages(data?.totalPages ?? 0);
      setTotalElements(data?.totalElements ?? 0);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không tải được danh sách booking.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setFilters((current) => current.query === urlQuery ? current : { ...current, query: urlQuery });
    setPage(0);
  }, [urlQuery]);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setPage(0);
      void loadBookings(0, filters);
    }, 350);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [filters, loadBookings]);

  const updateFilter = (key: keyof AdminBookingFilters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(0);
  };

  const resetFilters = () => {
    setFilters({
      query: '',
      status: '',
      paymentOption: '',
      createdFrom: '',
      createdTo: '',
      serviceFrom: '',
      serviceTo: '',
    });
    setPage(0);
  };

  const openDetail = async (booking: AdminBooking) => {
    setSelectedBooking(booking);
    setIsDetailLoading(true);
    try {
      setSelectedBooking(await getAdminBookingDetail(booking.id));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không tải được chi tiết booking.'));
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    void loadBookings(nextPage, filters);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const summary = useMemo(() => {
    const completed = bookings.filter((booking) => booking.status === 'COMPLETED').length;
    const pending = bookings.filter((booking) => booking.status === 'PENDING_PAYMENT' || booking.status === 'PENDING_NURSE_ACCEPTANCE').length;
    const gmv = bookings.reduce((sum, booking) => sum + Number(booking.grossAmount ?? 0), 0);
    const paid = bookings.reduce((sum, booking) => sum + Number(booking.appPaymentAmount ?? 0), 0);
    return { completed, pending, gmv, paid };
  }, [bookings]);

  return (
    <>
      <Topbar
        title="Quản lý booking"
        subtitle="Theo dõi lịch dịch vụ, khách hàng, nurse và dòng tiền booking."
      />

      <div className="space-y-5">
        <Card className="p-5">
          <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-lav-dark">
                <CalendarRange size={15} /> Bộ lọc booking
              </div>
              <p className="mt-1 text-sm font-semibold text-text-light">
                Lọc theo khoảng ngày lịch hẹn, có thể tìm nhanh theo booking, khách, nurse hoặc dịch vụ.
              </p>
            </div>
            <button
              onClick={() => loadBookings(page, filters)}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-lav-100 bg-white px-3 text-xs font-black text-lav-dark shadow-sm transition hover:bg-lav-50"
            >
              <RefreshCw size={15} /> Làm mới
            </button>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(280px,1fr)_170px_170px_auto]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light" size={17} />
              <input
                value={filters.query}
                onChange={(event) => updateFilter('query', event.target.value)}
                placeholder="Tìm booking, khách, nurse, dịch vụ..."
                className="h-10 w-full rounded-xl border border-lav-100 bg-white pl-10 pr-4 text-sm font-bold text-text-dark outline-none transition placeholder:text-text-light focus:border-lav-acc focus:ring-4 focus:ring-lav-50"
              />
            </div>
            <DateInput value={filters.serviceFrom} onChange={(value) => updateFilter('serviceFrom', value)} />
            <DateInput value={filters.serviceTo} onChange={(value) => updateFilter('serviceTo', value)} />
            <button onClick={resetFilters} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-lav-100 bg-lav-50 px-4 text-sm font-black text-lav-dark transition hover:bg-lav-100">
              <X size={15} /> Xóa lọc
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="Tổng kết quả" value={totalElements.toLocaleString('vi-VN')} />
            <SummaryCard label="Hoàn thành trên trang" value={summary.completed.toString()} />
            <SummaryCard label="Đang chờ trên trang" value={summary.pending.toString()} />
            <SummaryCard label="GMV trên trang" value={compactVnd(summary.gmv)} detail={formatVnd(summary.gmv)} />
          </div>
        </Card>

        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</div>
        )}

        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-lav-100 px-5 py-4">
            <div>
              <div className="font-sans text-xl font-black text-text-dark">Danh sách booking</div>
              <div className="mt-1 text-sm font-semibold text-text-light">Bảng gọn theo dòng, tránh tràn dữ liệu dài.</div>
            </div>
            <button onClick={() => loadBookings(page, filters)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-lav-50 text-lav-dark transition hover:bg-lav-100" aria-label="Làm mới">
              <RefreshCw size={17} />
            </button>
          </div>

          {isLoading ? (
            <div className="flex h-72 items-center justify-center">
              <Loader2 className="animate-spin text-lav-dark" size={34} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1020px] table-fixed text-left">
                <colgroup>
                  <col className="w-[12%]" />
                  <col className="w-[14%]" />
                  <col className="w-[14%]" />
                  <col className="w-[18%]" />
                  <col className="w-[15%]" />
                  <col className="w-[13%]" />
                  <col className="w-[9%]" />
                  <col className="w-[5%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-lav-100 bg-lav-50/60 text-[11px] font-black uppercase tracking-wide text-text-light">
                    <th className="px-4 py-3">Booking</th>
                    <th className="px-4 py-3">Khách hàng</th>
                    <th className="px-4 py-3">Nurse</th>
                    <th className="px-4 py-3">Dịch vụ</th>
                    <th className="px-4 py-3">Lịch hẹn</th>
                    <th className="px-4 py-3">Thanh toán</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-lav-100">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="transition hover:bg-lav-50/40">
                      <td className="px-4 py-3 align-top">
                        <div className="text-sm font-black leading-5 text-text-dark">{booking.bookingKey}</div>
                        <div className="mt-1 text-xs font-bold text-text-light">ID {shortId(booking.id)}</div>
                      </td>
                      <td className="px-4 py-3 align-top"><PersonBlock person={booking.mother} /></td>
                      <td className="px-4 py-3 align-top"><PersonBlock person={booking.nurse} /></td>
                      <td className="px-4 py-3 align-top">
                        <div className="max-w-[210px] truncate text-sm font-black text-text-dark" title={booking.service?.serviceName ?? '--'}>
                          {booking.service?.serviceName ?? '--'}
                        </div>
                        <div className="mt-1 text-xs font-semibold text-text-light">{booking.service?.groupName ?? '--'}</div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="inline-flex items-center gap-1.5 text-sm font-black text-text-dark">
                          <CalendarDays size={15} className="text-lav-dark" /> {formatDate(booking.startAt)}
                        </div>
                        <div className="mt-1 text-[11px] font-semibold text-text-light">Tạo lúc {formatDate(booking.createdAt)}</div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="text-sm font-black text-text-dark">{formatVnd(booking.grossAmount)}</div>
                        <div className="mt-1 text-xs font-bold text-sky-700">App {formatVnd(booking.appPaymentAmount)}</div>
                        <div className="mt-1 text-[11px] font-semibold text-text-light">{paymentLabel[booking.paymentOption]}</div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-black ring-1 ${statusTone[booking.status]}`}>
                          {statusLabel[booking.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right align-top">
                        <button onClick={() => openDetail(booking)} className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-lav-50 text-lav-dark transition hover:bg-lav-100" aria-label="Xem chi tiết">
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!bookings.length && (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center text-sm font-bold text-text-light">
                        Không có booking phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} isLoading={isLoading} />
      </div>

      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex justify-end bg-dark-100/35 backdrop-blur-sm" onClick={() => setSelectedBooking(null)}>
          <aside className="h-full w-full max-w-[520px] overflow-y-auto bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-lav-dark">Chi tiết booking</div>
                <h2 className="mt-1 font-sans text-2xl font-black text-text-dark">{selectedBooking.bookingKey}</h2>
                <div className="mt-1 text-xs font-bold text-text-light">ID {selectedBooking.id}</div>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-lav-50 text-lav-dark">
                <X size={18} />
              </button>
            </div>

            {isDetailLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="animate-spin text-lav-dark" size={32} />
              </div>
            ) : (
              <div className="space-y-4">
                <DetailSection title="Trạng thái">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${statusTone[selectedBooking.status]}`}>
                    {statusLabel[selectedBooking.status]}
                  </span>
                </DetailSection>
                <DetailSection title="Khách hàng"><PersonBlock person={selectedBooking.mother} large showId /></DetailSection>
                <DetailSection title="Nurse"><PersonBlock person={selectedBooking.nurse} large showId /></DetailSection>
                <DetailSection title="Dịch vụ">
                  <div className="font-black text-text-dark">{selectedBooking.service?.serviceName ?? '--'}</div>
                  <div className="mt-1 text-sm font-semibold text-text-light">{selectedBooking.service?.groupName ?? '--'}</div>
                </DetailSection>
                <DetailSection title="Lịch và địa chỉ">
                  <div className="font-bold text-text-dark">{formatDate(selectedBooking.startAt)} - {formatDate(selectedBooking.endAt)}</div>
                  <div className="mt-2 text-sm font-semibold text-text-light">{selectedBooking.serviceAddress}</div>
                </DetailSection>
                <DetailSection title="Dòng tiền">
                  <MoneyRow label="GMV" value={selectedBooking.grossAmount} />
                  <MoneyRow label="Khách trả qua app" value={selectedBooking.appPaymentAmount} />
                  <MoneyRow label="Cọc" value={selectedBooking.depositAmount} />
                  <MoneyRow label="Còn thu tiền mặt" value={selectedBooking.remainingCashAmount} />
                  <MoneyRow label="Hoa hồng platform" value={selectedBooking.platformFeeAmount} />
                  <MoneyRow label="Nurse nhận" value={selectedBooking.nurseEarningAmount} />
                </DetailSection>
                {selectedBooking.motherNote && (
                  <DetailSection title="Ghi chú">
                    <div className="text-sm font-semibold leading-6 text-text-mid">{selectedBooking.motherNote}</div>
                  </DetailSection>
                )}
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );
};

const DateInput = ({ value, onChange }: { value?: string; onChange: (value: string) => void }) => (
  <label className="block">
    <input
      type="date"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 w-full rounded-xl border border-lav-100 bg-white px-3 text-sm font-black text-text-dark outline-none transition focus:border-lav-acc focus:ring-4 focus:ring-lav-50"
    />
  </label>
);

const SummaryCard = ({ label, value, detail }: { label: string; value: string; detail?: string }) => (
  <div className="rounded-2xl border border-lav-100 bg-white px-4 py-3 shadow-sm">
    <div className="text-[11px] font-black uppercase tracking-wider text-text-light">{label}</div>
    <div className="mt-1 truncate text-xl font-black text-text-dark" title={detail ?? value}>{value}</div>
    {detail && <div className="mt-0.5 truncate text-xs font-bold text-text-light">{detail}</div>}
  </div>
);

const PersonBlock = ({
  person,
  large = false,
  showId = false,
}: {
  person?: { id?: string; fullName?: string; phone?: string; email?: string };
  large?: boolean;
  showId?: boolean;
}) => (
  <div className="min-w-0">
    <div className={`${large ? 'text-base' : 'text-sm'} truncate font-black text-text-dark`} title={person?.fullName || '--'}>
      {person?.fullName || '--'}
    </div>
    <div className="mt-1 truncate text-xs font-semibold text-text-light" title={person?.phone || person?.email || '--'}>
      {person?.phone || person?.email || '--'}
    </div>
    {showId && person?.id && (
      <div className="mt-1 break-all text-[11px] font-bold text-text-light">ID {person.id}</div>
    )}
  </div>
);

const DetailSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="rounded-2xl border border-lav-100 p-4">
    <div className="mb-3 text-xs font-black uppercase tracking-wider text-text-light">{title}</div>
    {children}
  </section>
);

const MoneyRow = ({ label, value }: { label: string; value?: number }) => (
  <div className="flex items-center justify-between gap-4 border-b border-lav-50 py-2 last:border-b-0">
    <span className="text-sm font-bold text-text-mid">{label}</span>
    <span className="text-sm font-black text-text-dark">{formatVnd(value)}</span>
  </div>
);

export default AdminBookings;
