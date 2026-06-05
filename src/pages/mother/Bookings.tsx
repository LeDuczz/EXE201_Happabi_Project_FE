import { ArrowLeft, CalendarClock, CheckCircle2, Clock, CreditCard, MapPin, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
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
}

const formatCurrency = (value?: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value ?? 0);

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

const steps = [
  { number: 1, label: 'Chọn nurse' },
  { number: 2, label: 'Giữ lịch' },
  { number: 3, label: 'Thanh toán' },
];

const MotherBookings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const selected = (location.state ?? {}) as BookingLocationState;
  const [startAt, setStartAt] = useState(minimumStartAt);
  const [serviceAddress, setServiceAddress] = useState('');
  const [motherNote, setMotherNote] = useState('');
  const [draft, setDraft] = useState<BookingDraft | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canCreateDraft = Boolean(
    selected.nurseProfileId &&
    selected.serviceOfferingId &&
    startAt &&
    serviceAddress.trim(),
  );

  const activeStep = useMemo(() => {
    if (draft) return 3;
    if (selected.nurseProfileId && selected.serviceOfferingId) return 2;
    return 1;
  }, [draft, selected.nurseProfileId, selected.serviceOfferingId]);

  const createDraft = async () => {
    if (!canCreateDraft || !selected.nurseProfileId || !selected.serviceOfferingId) return;

    setIsSubmitting(true);
    setError('');

    try {
      const response = await bookingService.createDraft({
        nurseProfileId: selected.nurseProfileId,
        serviceOfferingId: selected.serviceOfferingId,
        startAt: new Date(startAt).toISOString(),
        serviceAddress: serviceAddress.trim(),
        motherNote: motherNote.trim() || undefined,
      });
      setDraft(response);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Topbar title="Đặt lịch chăm sóc" subtitle="Giữ lịch nurse trong thời gian ngắn trước khi chuyển sang thanh toán." />

      <button
        type="button"
        onClick={() => navigate('/mother/search')}
        className="mb-5 inline-flex items-center gap-2 text-[13px] font-black text-lav-dark"
      >
        <ArrowLeft size={16} />
        Chọn nurse khác
      </button>

      <Card className="mb-6">
        <div className="grid gap-3 md:grid-cols-3">
          {steps.map((step) => {
            const active = activeStep === step.number;
            const done = activeStep > step.number;
            return (
              <div
                key={step.number}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
                  active || done ? 'border-lav-300 bg-lav-50' : 'border-lav-100 bg-white'
                }`}
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-black ${
                    done ? 'bg-verified text-white' : active ? 'bg-grad text-white' : 'bg-lav-100 text-text-mid'
                  }`}
                >
                  {done ? <CheckCircle2 size={17} /> : step.number}
                </div>
                <span className="text-[13px] font-black text-text-dark">{step.label}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {!selected.nurseProfileId || !selected.serviceOfferingId ? (
        <Card className="text-center">
          <CalendarClock className="mx-auto text-lav-dark" size={34} />
          <h2 className="mt-3 font-serif text-[24px] font-black text-text-dark">Chưa chọn nurse và dịch vụ</h2>
          <p className="mx-auto mt-2 max-w-[520px] text-[14px] font-bold leading-6 text-text-mid">
            Vui lòng chọn một nurse trong danh sách, sau đó chọn dịch vụ hoặc gói chăm sóc để bắt đầu đặt lịch.
          </p>
          <Btn className="mt-5" onClick={() => navigate('/mother/search')}>
            Tìm nurse
          </Btn>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
          <Card>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-lav-100 text-lav-dark">
                <CalendarClock size={20} />
              </div>
              <div>
                <h2 className="font-serif text-[24px] font-black text-text-dark">Thông tin lịch hẹn</h2>
                <p className="text-[13px] font-bold text-text-mid">Chọn thời gian và địa chỉ chăm sóc tại nhà.</p>
              </div>
            </div>

            {error && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-bold text-red-700">
                {error}
              </div>
            )}

            {draft && (
              <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-[13px] font-bold text-green-700">
                Đã giữ lịch thành công. Vui lòng hoàn tất thanh toán trước {new Date(draft.holdExpiresAt).toLocaleTimeString('vi-VN')}.
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-[13px] font-black text-text-dark">
                  <Clock size={15} />
                  Thời gian bắt đầu
                </span>
                <input
                  type="datetime-local"
                  value={startAt}
                  min={minimumStartAt()}
                  onChange={(event) => setStartAt(event.target.value)}
                  disabled={Boolean(draft)}
                  className="w-full rounded-2xl border border-lav-200 bg-white px-4 py-3 text-[14px] font-bold text-text-dark outline-none transition focus:border-lav-400"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 flex items-center gap-2 text-[13px] font-black text-text-dark">
                  <MapPin size={15} />
                  Địa chỉ chăm sóc
                </span>
                <input
                  value={serviceAddress}
                  onChange={(event) => setServiceAddress(event.target.value)}
                  disabled={Boolean(draft)}
                  placeholder="Ví dụ: 12 Nguyễn Huệ, phường Bến Nghé, Quận 1, TP.HCM"
                  className="w-full rounded-2xl border border-lav-200 bg-white px-4 py-3 text-[14px] font-bold text-text-dark outline-none transition focus:border-lav-400"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 text-[13px] font-black text-text-dark">Ghi chú cho nurse</span>
                <textarea
                  value={motherNote}
                  onChange={(event) => setMotherNote(event.target.value)}
                  disabled={Boolean(draft)}
                  rows={5}
                  placeholder="Nhu cầu chăm sóc, tình trạng mẹ/bé, giờ vào nhà..."
                  className="w-full resize-none rounded-2xl border border-lav-200 bg-white px-4 py-3 text-[14px] font-bold text-text-dark outline-none transition focus:border-lav-400"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              {!draft ? (
                <Btn disabled={!canCreateDraft || isSubmitting} onClick={createDraft}>
                  <ShieldCheck size={16} />
                  {isSubmitting ? 'Đang giữ lịch...' : 'Giữ lịch 15 phút'}
                </Btn>
              ) : (
                <Btn onClick={() => navigate('/mother/bookings/payment', { state: { draftId: draft.draftId } })}>
                  <CreditCard size={16} />
                  Tiếp tục thanh toán
                </Btn>
              )}
            </div>
          </Card>

          <Card>
            <h2 className="font-serif text-[24px] font-black text-text-dark">Tóm tắt đặt lịch</h2>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-lav-100 bg-lav-50 p-4">
                <p className="text-[12px] font-bold text-text-light">Nurse</p>
                <p className="mt-1 text-[16px] font-black text-text-dark">{selected.nurseName || 'Nurse Happabi'}</p>
              </div>

              <div className="rounded-2xl border border-lav-100 bg-white p-4">
                <p className="text-[12px] font-bold text-text-light">Dịch vụ</p>
                <p className="mt-1 text-[16px] font-black text-text-dark">{selected.serviceName}</p>
              </div>

              <div className="rounded-2xl border border-pink-100 bg-pink-50 p-4">
                <p className="text-[12px] font-bold text-text-light">Tổng tiền</p>
                <p className="mt-1 text-[28px] font-black text-grad">{formatCurrency(selected.grossAmount)}</p>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[13px] font-bold leading-6 text-amber-800">
                Tiền cọc và thanh toán PayOS sẽ nối ở bước kế tiếp. Ở bước này hệ thống chỉ giữ slot để tránh hai người đặt cùng một nurse cùng thời điểm.
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

export default MotherBookings;
