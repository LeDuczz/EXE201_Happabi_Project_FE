import { CalendarDays, Loader2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  cancelMyAvailabilityWindow,
  createMyAvailabilityWindow,
  getMyAvailabilityWindows,
} from '../../api/nurseProfileApi';
import type { AvailabilityStatus, NurseAvailabilityWindow } from '../../types/nurseProfile';
import { getApiErrorMessage } from '../../utils/apiError';
import Btn from '../common/Btn';
import Card from '../common/Card';
import Tag from '../common/Tag';

const text = {
  title: 'Khung sẵn sàng nhận lịch',
  subtitle: 'Mother chỉ có thể đặt lịch trong các khoảng thời gian bạn đã mở.',
  active: 'Đang hiệu lực',
  createSuccess: 'Đã mở khung sẵn sàng nhận lịch.',
  cancelSuccess: 'Đã hủy khung nhận lịch.',
  start: 'Bắt đầu',
  end: 'Kết thúc',
  saving: 'Đang lưu...',
  open: 'Mở lịch',
  empty: 'Bạn chưa mở khung nhận lịch nào.',
  cancel: 'Hủy',
};

const statusLabel: Record<string, string> = {
  ACTIVE: text.active,
};

const toLocalDateTimeInput = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const toIsoOffset = (value: string) => (value ? new Date(value).toISOString() : '');

const formatDateTime = (value?: string) => {
  if (!value) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

const defaultStart = () => {
  const date = new Date();
  date.setHours(date.getHours() + 1, 0, 0, 0);
  return toLocalDateTimeInput(date);
};

const defaultEnd = () => {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  date.setHours(23, 59, 0, 0);
  return toLocalDateTimeInput(date);
};

const shouldShowWindow = (window: NurseAvailabilityWindow) =>
  window.status === 'ACTIVE' && new Date(window.endAt).getTime() > Date.now();

interface AvailabilityWindowsPanelProps {
  onAvailabilityStatusChanged?: (status: AvailabilityStatus) => void;
}

const AvailabilityWindowsPanel = ({ onAvailabilityStatusChanged }: AvailabilityWindowsPanelProps) => {
  const [windows, setWindows] = useState<NurseAvailabilityWindow[]>([]);
  const [startAt, setStartAt] = useState(defaultStart);
  const [endAt, setEndAt] = useState(defaultEnd);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadWindows = async () => {
    setError('');
    setIsLoading(true);
    try {
      setWindows(await getMyAvailabilityWindows());
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadWindows();
  }, []);

  const createWindow = async () => {
    setError('');
    setSuccess('');
    setIsSaving(true);
    try {
      const createdWindow = await createMyAvailabilityWindow({
        startAt: toIsoOffset(startAt),
        endAt: toIsoOffset(endAt),
      });
      setSuccess(text.createSuccess);
      await loadWindows();
      if (createdWindow.nurseAvailabilityStatus) {
        onAvailabilityStatusChanged?.(createdWindow.nurseAvailabilityStatus);
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const cancelWindow = async (windowId: string) => {
    setError('');
    setSuccess('');
    try {
      const cancelledWindow = await cancelMyAvailabilityWindow(windowId);
      setSuccess(text.cancelSuccess);
      await loadWindows();
      if (cancelledWindow.nurseAvailabilityStatus) {
        onAvailabilityStatusChanged?.(cancelledWindow.nurseAvailabilityStatus);
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const visibleWindows = windows.filter(shouldShowWindow);

  return (
    <Card>
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-50 text-green-700">
          <CalendarDays size={20} />
        </div>
        <div>
          <h3 className="font-sans text-[23px] font-black text-text-dark">{text.title}</h3>
          <p className="text-[13px] font-semibold text-text-light">{text.subtitle}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-bold text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-[13px] font-bold text-green-700">
          {success}
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
        <div>
          <label className="text-[12px] font-black text-text-light">{text.start}</label>
          <input
            type="datetime-local"
            value={startAt}
            onChange={(event) => setStartAt(event.target.value)}
            className="mt-1 h-11 w-full rounded-2xl border border-lav-200 bg-white px-4 text-[14px] font-bold outline-none focus:border-lav-acc focus:ring-4 focus:ring-lav-100"
          />
        </div>
        <div>
          <label className="text-[12px] font-black text-text-light">{text.end}</label>
          <input
            type="datetime-local"
            value={endAt}
            onChange={(event) => setEndAt(event.target.value)}
            className="mt-1 h-11 w-full rounded-2xl border border-lav-200 bg-white px-4 text-[14px] font-bold outline-none focus:border-lav-acc focus:ring-4 focus:ring-lav-100"
          />
        </div>
        <div className="flex items-end">
          <Btn type="button" onClick={createWindow} disabled={isSaving || !startAt || !endAt}>
            {isSaving ? text.saving : text.open}
          </Btn>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {isLoading ? (
          <div className="flex h-24 items-center justify-center text-lav-dark">
            <Loader2 className="animate-spin" size={24} />
          </div>
        ) : visibleWindows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-lav-200 bg-lav-50 px-4 py-6 text-center text-[13px] font-bold text-text-mid">
            {text.empty}
          </div>
        ) : (
          visibleWindows.map((window) => (
            <div
              key={window.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-lav-100 bg-white px-4 py-3"
            >
              <div>
                <div className="text-[13px] font-black text-text-dark">
                  {formatDateTime(window.startAt)} - {formatDateTime(window.endAt)}
                </div>
                <div className="mt-1">
                  <Tag variant={window.status === 'ACTIVE' ? 'green' : 'gray'}>
                    {statusLabel[window.status] || window.status}
                  </Tag>
                </div>
              </div>
              {window.status === 'ACTIVE' && (
                <button
                  type="button"
                  onClick={() => cancelWindow(window.id)}
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 text-[12px] font-black text-red-700 hover:bg-red-100"
                >
                  <X size={14} />
                  {text.cancel}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default AvailabilityWindowsPanel;
