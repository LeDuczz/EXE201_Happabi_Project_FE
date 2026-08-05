import { CalendarDays, Eye, Loader2, RefreshCw, Search, SlidersHorizontal, X } from 'lucide-react';
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

const statusOptions: Array<{ value: AdminBookingStatus | ''; label: string }> = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'PENDING_PAYMENT', label: 'Chờ thanh toán' },
  { value: 'PENDING_NURSE_ACCEPTANCE', label: 'Chờ nurse nhận' },
  { value: 'ACCEPTED', label: 'Đã nhận' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'CANCELLED', label: 'Đã hủy' },
  { value: 'REJECTED', label: 'Đã từ chối' },
];

const paymentOptions: Array<{ value: AdminBookingPaymentOption | ''; label: string }> = [
  { value: '', label: 'Tất cả thanh toán' },
  { value: 'DEPOSIT_30_PERCENT', label: 'Cọc 30%' },
  { value: 'FULL_APP_PAYMENT', label: 'Thanh toán 100%' },
];

const formatVnd = (value?: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value ?? 0));

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
  const pageSize = 12;
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setFilters((current) => current.query === urlQuery ? current : { ...current, query: urlQuery });
    setPage(0);
  }, [urlQuery]);

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
        subtitle="Theo dõi booking theo trạng thái, lịch dịch vụ, khách hàng, nurse và dòng tiền."
      />

      <div className="space-y-5">
        <Card className="p-5">
          <div className="grid gap-3 xl:grid-cols-[minmax(260px,1.4fr)_170px_170px_150px_150px_150px_150px_auto]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light" size={18} />
              <input
                value={filters.query}
                onChange={(event) => updateFilter('query', event.target.value)}
                placeholder="Tìm booking, khách, nurse, dịch vụ..."
                className="h-11 w-full rounded-2xl border border-lav-100 bg-white pl-11 pr-4 text-sm font-bold text-text-dark outline-none transition focus:border-lav-acc"
              />
            </div>
            <select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)} className="h-11 rounded-2xl border border-lav-100 bg-white px-3 text-sm font-bold text-text-dark outline-none focus:border-lav-acc">
              {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <select value={filters.paymentOption} onChange={(event) => updateFilter('paymentOption', event.target.value)} className="h-11 rounded-2xl border border-lav-100 bg-white px-3 text-sm font-bold text-text-dark outline-none focus:border-lav-acc">
              {paymentOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <input type="date" value={filters.createdFrom} onChange={(event) => updateFilter('createdFrom', event.target.value)} className="h-11 rounded-2xl border border-lav-100 bg-white px-3 text-sm font-bold text-text-dark outline-none focus:border-lav-acc" />
            <input type="date" value={filters.createdTo} onChange={(event) => updateFilter('createdTo', event.target.value)} className="h-11 rounded-2xl border border-lav-100 bg-white px-3 text-sm font-bold text-text-dark outline-none focus:border-lav-acc" />
            <input type="date" value={filters.serviceFrom} onChange={(event) => updateFilter('serviceFrom', event.target.value)} className="h-11 rounded-2xl border border-lav-100 bg-white px-3 text-sm font-bold text-text-dark outline-none focus:border-lav-acc" />
            <input type="date" value={filters.serviceTo} onChange={(event) => updateFilter('serviceTo', event.target.value)} className="h-11 rounded-2xl border border-lav-100 bg-white px-3 text-sm font-bold text-text-dark outline-none focus:border-lav-acc" />
            <button onClick={resetFilters} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-lav-100 bg-lav-50 px-4 text-sm font-black text-lav-dark transition hover:bg-lav-100">
              <SlidersHorizontal size={16} /> Xóa lọc
            </button>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard label="Tổng kết quả" value={totalElements.toLocaleString('vi-VN')} />
            <SummaryCard label="Hoàn thành trên trang" value={summary.completed.toString()} />
            <SummaryCard label="Đang chờ trên trang" value={summary.pending.toString()} />
            <SummaryCard label="GMV trên trang" value={formatVnd(summary.gmv)} />
          </div>
        </Card>

        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</div>
        )}

        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-lav-100 px-5 py-4">
            <div>
              <div className="font-sans text-xl font-black text-text-dark">Danh sách booking</div>
              <div className="mt-1 text-sm font-semibold text-text-light">Sắp xếp mới nhất trước, hỗ trợ tìm kiếm và lọc theo kỳ.</div>
            </div>
            <button onClick={() => loadBookings(page, filters)} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-lav-50 text-lav-dark transition hover:bg-lav-100" aria-label="Làm mới">
              <RefreshCw size={17} />
            </button>
          </div>

          {isLoading ? (
            <div className="flex h-72 items-center justify-center">
              <Loader2 className="animate-spin text-lav-dark" size={34} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] text-left">
                <thead>
                  <tr className="border-b border-lav-100 bg-lav-50/50 text-xs font-black uppercase tracking-wider text-text-light">
                    <th className="px-5 py-3">Booking</th>
                    <th className="px-5 py-3">Khách hàng</th>
                    <th className="px-5 py-3">Nurse</th>
                    <th className="px-5 py-3">Dịch vụ</th>
                    <th className="px-5 py-3">Lịch hẹn</th>
                    <th className="px-5 py-3">Thanh toán</th>
                    <th className="px-5 py-3">Trạng thái</th>
                    <th className="px-5 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-lav-100">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="transition hover:bg-lav-50/40">
                      <td className="px-5 py-4">
                        <div className="font-black text-text-dark">{booking.bookingKey}</div>
                        <div className="mt-1 text-xs font-bold text-text-light">ID {shortId(booking.id)}</div>
                      </td>
                      <td className="px-5 py-4">
                        <PersonBlock person={booking.mother} />
                      </td>
                      <td className="px-5 py-4">
                        <PersonBlock person={booking.nurse} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="max-w-[210px] font-bold text-text-dark">{booking.service?.serviceName ?? '--'}</div>
                        <div className="mt-1 text-xs font-semibold text-text-light">{booking.service?.groupName ?? '--'}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="inline-flex items-center gap-2 font-bold text-text-dark">
                          <CalendarDays size={15} className="text-lav-dark" /> {formatDate(booking.startAt)}
                        </div>
                        <div className="mt-1 text-xs font-semibold text-text-light">Tạo lúc {formatDate(booking.createdAt)}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-black text-text-dark">{formatVnd(booking.grossAmount)}</div>
                        <div className="mt-1 text-xs font-bold text-sky-700">App {formatVnd(booking.appPaymentAmount)}</div>
                        <div className="mt-1 text-[11px] font-semibold text-text-light">{paymentLabel[booking.paymentOption]}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${statusTone[booking.status]}`}>
                          {statusLabel[booking.status]}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button onClick={() => openDetail(booking)} className="inline-flex items-center gap-2 rounded-xl bg-lav-50 px-3 py-2 text-xs font-black text-lav-dark transition hover:bg-lav-100">
                          <Eye size={15} /> Chi tiết
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
                <DetailSection title="Khách hàng">
                  <PersonBlock person={selectedBooking.mother} large />
                </DetailSection>
                <DetailSection title="Nurse">
                  <PersonBlock person={selectedBooking.nurse} large />
                </DetailSection>
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

const SummaryCard = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-lav-100 bg-lav-50/40 px-4 py-3">
    <div className="text-[11px] font-black uppercase tracking-wider text-text-light">{label}</div>
    <div className="mt-1 text-xl font-black text-text-dark">{value}</div>
  </div>
);

const PersonBlock = ({ person, large = false }: { person?: { fullName?: string; phone?: string; email?: string }; large?: boolean }) => (
  <div>
    <div className={`${large ? 'text-base' : 'text-sm'} font-black text-text-dark`}>{person?.fullName || '--'}</div>
    <div className="mt-1 text-xs font-semibold text-text-light">{person?.phone || person?.email || '--'}</div>
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
