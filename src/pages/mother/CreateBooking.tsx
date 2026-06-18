import { useMemo, useState } from 'react';
import { ArrowLeft, CalendarClock, Clock, CreditCard, MapPin, Search, ShieldCheck } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import bookingService, { type BookingDraft } from '../../api/bookingService';
import Btn from '../../components/common/Btn';
import Card from '../../components/common/Card';
import Topbar from '../../components/layout/Topbar';
import { getApiErrorMessage } from '../../utils/apiError';

interface BookingLocationState {
  nurseProfileId?: string;
  nurseName?: string;
  serviceOfferingId?: string;
  serviceName?: string;
  grossAmount?: number;
  durationMinutes?: number;
}

const formatCurrency = (value?: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value ?? 0);

const toDateTimeLocalValue = (date: Date) => {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
};

const minimumStartAt = () => {
  const date = new Date();
  date.setHours(date.getHours() + 2, 0, 0, 0);
  return toDateTimeLocalValue(date);
};

const addMinutesToLocalDateTime = (value: string, minutes: number) => {
  if (!value) return '';
  const date = new Date(value);
  date.setMinutes(date.getMinutes() + minutes);
  return toDateTimeLocalValue(date);
};

const CreateBooking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const selected = (location.state ?? {}) as BookingLocationState;

  const [startAt, setStartAt] = useState(minimumStartAt);
  const [paymentOption, setPaymentOption] = useState<'DEPOSIT_30_PERCENT' | 'FULL_APP_PAYMENT'>('DEPOSIT_30_PERCENT');
  const [serviceAddress, setServiceAddress] = useState('');
  const [motherNote, setMotherNote] = useState('');
  const [draft, setDraft] = useState<BookingDraft | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasSelectedService = Boolean(selected.nurseProfileId && selected.serviceOfferingId);
  const durationMinutes = selected.durationMinutes ?? 60;
  const expectedEndAt = useMemo(() => addMinutesToLocalDateTime(startAt, durationMinutes), [startAt, durationMinutes]);
  const grossAmount = selected.grossAmount ?? 0;
  const depositAmount = Math.round(grossAmount * 0.3);
  const remainingCashAmount = grossAmount - depositAmount;

  const canCreateBooking = Boolean(
    selected.nurseProfileId &&
      selected.serviceOfferingId &&
      startAt &&
      serviceAddress.trim(),
  );

  const createBooking = async () => {
    if (!canCreateBooking || !selected.nurseProfileId || !selected.serviceOfferingId) return;
    setIsSubmitting(true);
    setError('');
    try {
      const response = await bookingService.createDraft({
        nurseProfileId: selected.nurseProfileId,
        serviceOfferingId: selected.serviceOfferingId,
        startAt: new Date(startAt).toISOString(),
        serviceAddress: serviceAddress.trim(),
        motherNote: motherNote.trim() || undefined,
        paymentOption,
      });
      setDraft(response);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-10">
      <Topbar title="Đặt lịch" subtitle="Chọn giờ bắt đầu, hệ thống tự tính giờ kết thúc và kiểm tra lịch trùng." />

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-bold text-red-700">
          {error}
        </div>
      )}

      {!hasSelectedService ? (
        <Card className="mx-auto max-w-[680px] text-center">
          <CalendarClock className="mx-auto text-lav-dark" size={38} />
          <h2 className="mt-3 text-[22px] font-semibold text-text-dark">Chưa chọn nurse và dịch vụ</h2>
          <p className="mx-auto mt-2 max-w-[520px] text-[14px] font-bold leading-6 text-text-mid">
            Hãy chọn một nurse từ danh sách, sau đó chọn dịch vụ lẻ để bắt đầu đặt lịch.
          </p>
          <Btn className="mt-5" onClick={() => navigate('/mother/search')}>
            <Search size={16} />
            Tìm nurse
          </Btn>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card>
            <button
              type="button"
              onClick={() => navigate('/mother/search')}
              className="mb-5 inline-flex items-center gap-2 text-[13px] font-semibold text-lav-dark"
            >
              <ArrowLeft size={16} />
              Chọn nurse khác
            </button>

            {draft && (
              <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-bold text-emerald-700">
                Booking đã được tạo. Vui lòng hoàn tất thanh toán trước {new Date(draft.paymentExpiresAt).toLocaleTimeString('vi-VN')}.
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-text-dark">
                  <Clock size={15} />
                  Thời gian bắt đầu
                </span>
                <input
                  type="datetime-local"
                  value={startAt}
                  min={minimumStartAt()}
                  step={3600}
                  onChange={(event) => setStartAt(event.target.value)}
                  disabled={Boolean(draft)}
                  className="w-full rounded-xl border border-lav-200 bg-white px-4 py-3 text-[14px] font-bold text-text-dark outline-none transition focus:border-lav-400"
                />
              </label>

              <div className="rounded-xl border border-lav-100 bg-lav-50 px-4 py-3">
                <span className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-text-dark">
                  <Clock size={15} />
                  Thời gian kết thúc
                </span>
                <p className="text-[14px] font-semibold text-text-dark">
                  {expectedEndAt ? new Date(expectedEndAt).toLocaleString('vi-VN') : 'Chưa chọn'}
                </p>
                <p className="mt-1 text-[12px] font-bold text-text-light">{durationMinutes} phút</p>
              </div>

              <div className="md:col-span-2">
                <span className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-text-dark">
                  <CreditCard size={15} />
                  Phương thức thanh toán
                </span>
                <div className="grid gap-3 md:grid-cols-2">
                  <button
                    type="button"
                    disabled={Boolean(draft)}
                    onClick={() => setPaymentOption('DEPOSIT_30_PERCENT')}
                    className={`rounded-xl border p-4 text-left transition ${
                      paymentOption === 'DEPOSIT_30_PERCENT'
                        ? 'border-lav-400 bg-lav-50 shadow-sm'
                        : 'border-lav-100 bg-white hover:border-lav-300'
                    }`}
                  >
                    <p className="text-[13px] font-semibold text-text-dark">Cọc 30%</p>
                    <p className="mt-1 text-[12px] font-bold text-text-mid">
                      Thanh toán app {formatCurrency(depositAmount)}, còn lại {formatCurrency(remainingCashAmount)} tiền mặt.
                    </p>
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(draft)}
                    onClick={() => setPaymentOption('FULL_APP_PAYMENT')}
                    className={`rounded-xl border p-4 text-left transition ${
                      paymentOption === 'FULL_APP_PAYMENT'
                        ? 'border-lav-400 bg-lav-50 shadow-sm'
                        : 'border-lav-100 bg-white hover:border-lav-300'
                    }`}
                  >
                    <p className="text-[13px] font-semibold text-text-dark">Thanh toán full qua app</p>
                    <p className="mt-1 text-[12px] font-bold text-text-mid">
                      Thanh toán app {formatCurrency(grossAmount)}, không cần thanh toán tiền mặt.
                    </p>
                  </button>
                </div>
              </div>

              <label className="block md:col-span-2">
                <span className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-text-dark">
                  <MapPin size={15} />
                  Địa chỉ chăm sóc
                </span>
                <input
                  value={serviceAddress}
                  onChange={(event) => setServiceAddress(event.target.value)}
                  disabled={Boolean(draft)}
                  placeholder="Ví dụ: 12 Nguyễn Huệ, Quận 1, TP.HCM"
                  className="w-full rounded-xl border border-lav-200 bg-white px-4 py-3 text-[14px] font-bold text-text-dark outline-none transition focus:border-lav-400"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 text-[13px] font-semibold text-text-dark">Ghi chú cho nurse</span>
                <textarea
                  value={motherNote}
                  onChange={(event) => setMotherNote(event.target.value)}
                  disabled={Boolean(draft)}
                  rows={4}
                  placeholder="Nhu cầu chăm sóc, tình trạng mẹ/bé, giờ vào nhà..."
                  className="w-full resize-none rounded-xl border border-lav-200 bg-white px-4 py-3 text-[14px] font-bold text-text-dark outline-none transition focus:border-lav-400"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end">
              {!draft ? (
                <Btn disabled={!canCreateBooking || isSubmitting} onClick={createBooking}>
                  <ShieldCheck size={16} />
                  {isSubmitting ? 'Đang tạo booking...' : 'Tạo booking'}
                </Btn>
              ) : (
                <Btn onClick={() => navigate('/mother/bookings')}>
                  <CalendarClock size={16} />
                  Xem đơn của tôi
                </Btn>
              )}
            </div>
          </Card>

          <Card className="h-fit">
            <p className="text-[12px] font-bold text-text-light">Nurse</p>
            <p className="mt-1 text-[17px] font-semibold text-text-dark">{selected.nurseName || 'Nurse Happabi'}</p>
            <p className="mt-4 text-[12px] font-bold text-text-light">Dịch vụ</p>
            <p className="mt-1 text-[17px] font-semibold text-text-dark">{selected.serviceName}</p>
            <p className="mt-4 text-[12px] font-bold text-text-light">Tổng tiền</p>
            <p className="mt-1 text-[30px] font-semibold text-grad">{formatCurrency(grossAmount)}</p>
            <p className="mt-4 text-[12px] font-bold text-text-light">Thời lượng</p>
            <p className="mt-1 text-[15px] font-semibold text-text-dark">{durationMinutes} phút</p>
            <p className="mt-4 text-[12px] font-bold text-text-light">Dự kiến</p>
            <p className="mt-1 text-[13px] font-bold text-text-mid">
              {new Date(startAt).toLocaleString('vi-VN')} - {expectedEndAt ? new Date(expectedEndAt).toLocaleTimeString('vi-VN') : ''}
            </p>
            {draft && (
              <div className="mt-5 rounded-xl border border-lav-100 bg-lav-50 p-4">
                <p className="text-[12px] font-bold text-text-light">Cần thanh toán qua app</p>
                <p className="mt-1 text-[22px] font-semibold text-grad">{formatCurrency(draft.appPaymentAmount)}</p>
                {!!draft.remainingCashAmount && (
                  <p className="mt-2 text-[12px] font-bold text-text-mid">
                    Còn lại {formatCurrency(draft.remainingCashAmount)} thanh toán tiền mặt sau ca.
                  </p>
                )}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default CreateBooking;
