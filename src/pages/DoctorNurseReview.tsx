import {
  AlertCircle,
  ArrowUpRight,
  BriefcaseMedical,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileBadge,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Btn from '../components/common/Btn';
import Card from '../components/common/Card';
import Topbar from '../components/layout/Topbar';
import type { NurseOnboarding } from '../types/nurseOnboarding';
import { getApiErrorMessage } from '../utils/apiError';

const specialtyLabel: Record<string, string> = {
  MIDWIFE: 'Hộ sinh',
  PEDIATRIC: 'Nhi khoa',
  GENERAL: 'Điều dưỡng tổng quát',
};

const DoctorNurseReview = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<NurseOnboarding[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter((item) => {
      const haystack = `${item.fullName || ''} ${item.phone || ''} ${item.email || ''} ${item.city || ''} ${item.specialty || ''}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [items, query]);

  const completionStats = useMemo(() => {
    const kycReady = items.filter((item) => item.kycCompleted).length;
    const certReady = items.filter((item) => item.certificationsCompleted).length;
    return { pending: items.length, kycReady, certReady };
  }, [items]);

  const loadPending = async () => {
    setError('');
    setIsLoading(true);
    try {
      const response = await axiosClient.get('/api/v1/doctor/nurses/pending-review');
      setItems(response.data?.data || []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không tải được danh sách hồ sơ nurse chờ duyệt.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPending();
  }, []);

  return (
    <div className="pb-10">
      <Topbar
        title="Clinical Review Queue"
        subtitle="Duyệt hồ sơ nurse đã hoàn tất onboarding, kiểm tra KYC và chứng chỉ trước khi chuyển sang ký hợp đồng."
      />

      {error && (
        <div className="mb-5 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mb-5 grid gap-4 lg:grid-cols-4">
        <StatCard icon={<Clock3 size={20} />} label="Pending Review" value={completionStats.pending} tone="amber" />
        <StatCard icon={<ShieldCheck size={20} />} label="KYC Ready" value={completionStats.kycReady} tone="green" />
        <StatCard icon={<FileBadge size={20} />} label="Certificate Ready" value={completionStats.certReady} tone="blue" />
        <Card className="border-none bg-grad p-5 text-white shadow-xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-white/70">Review SLA</div>
              <div className="mt-2 text-2xl font-black">24h</div>
              <div className="mt-1 text-xs font-bold text-white/75">Ưu tiên hồ sơ đủ KYC và chứng chỉ</div>
            </div>
            <Sparkles className="text-white/80" size={24} />
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-lav-100 bg-white px-6 py-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex items-center gap-2 text-lg font-black text-text-dark">
                <BriefcaseMedical size={20} className="text-lav-dark" />
                Hồ sơ cần bác sĩ duyệt
              </div>
              <p className="mt-1 text-sm font-semibold text-text-light">
                {filteredItems.length}/{items.length} hồ sơ đang hiển thị.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 md:flex-row xl:w-auto">
              <div className="flex min-h-[48px] flex-1 items-center gap-3 rounded-2xl border border-lav-100 bg-white px-4 shadow-sm transition-within:border-lav-300 md:min-w-[420px]">
                <Search size={18} className="shrink-0 text-text-light" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Tìm theo tên, SĐT, email, thành phố, chuyên môn..."
                  className="min-w-0 flex-1 bg-transparent text-sm font-bold text-text-dark outline-none placeholder:text-text-light"
                />
              </div>
              <Btn variant="soft" onClick={loadPending} disabled={isLoading} className="shrink-0">
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                Tải lại
              </Btn>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-[480px] items-center justify-center">
            <Loader2 className="animate-spin text-lav-dark" size={36} />
          </div>
        ) : filteredItems.length ? (
          <div className="grid gap-4 bg-[#fbf7ff] p-5 md:grid-cols-2 2xl:grid-cols-3">
            {filteredItems.map((item) => (
              <NurseReviewCard
                key={item.profileId}
                item={item}
                onReview={() => navigate(`/doctor/nurses/review/${item.profileId}`)}
              />
            ))}
          </div>
        ) : (
          <div className="flex min-h-[420px] items-center justify-center bg-[#fbf7ff] p-8 text-center">
            <div className="max-w-md">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600">
                <ShieldCheck size={34} />
              </div>
              <div className="text-xl font-black text-text-dark">Không có hồ sơ đang chờ duyệt</div>
              <p className="mt-2 text-sm font-semibold leading-6 text-text-light">
                Khi nurse hoàn tất onboarding và gửi hồ sơ, hệ thống sẽ đưa vào hàng đợi này.
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

const NurseReviewCard = ({ item, onReview }: { item: NurseOnboarding; onReview: () => void }) => {
  const certCount = item.certificationCount ?? item.certifications?.length ?? 0;
  const readyScore = [item.profileCompleted, item.kycCompleted, item.certificationsCompleted].filter(Boolean).length;

  return (
    <article className="group overflow-hidden rounded-3xl border border-lav-100 bg-white shadow-[0_16px_45px_rgba(64,25,109,0.06)] transition hover:-translate-y-1 hover:border-lav-300 hover:shadow-[0_22px_60px_rgba(64,25,109,0.12)]">
      <div className="border-b border-lav-100 bg-gradient-to-br from-white via-[#fff8fb] to-lav-50 p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-grad text-lg font-black text-white shadow-lg">
              {(item.fullName || 'N').slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-lg font-black text-text-dark">{item.fullName || 'Nurse chưa có tên'}</h3>
              <p className="mt-1 truncate text-sm font-semibold text-text-light">{item.phone || item.email || 'Chưa có liên hệ'}</p>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-black text-amber-700">
            <Clock3 size={13} /> Chờ duyệt
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <ReviewFlag label="Profile" done={Boolean(item.profileCompleted)} />
          <ReviewFlag label="KYC" done={Boolean(item.kycCompleted)} />
          <ReviewFlag label="Cert" done={Boolean(item.certificationsCompleted)} />
        </div>
      </div>

      <div className="p-5">
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <InfoChip icon={<MapPin size={15} />} label="Thành phố" value={item.city || '-'} />
          <InfoChip icon={<BriefcaseMedical size={15} />} label="Chuyên môn" value={specialtyLabel[item.specialty || ''] ?? item.specialty ?? '-'} />
          <InfoChip icon={<CalendarClock size={15} />} label="Kinh nghiệm" value={`${item.experienceYears ?? 0} năm`} />
          <InfoChip icon={<FileBadge size={15} />} label="Chứng chỉ" value={`${certCount}`} />
        </div>

        <div className="mb-5 rounded-2xl border border-lav-100 bg-lav-50 p-3">
          <div className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-wider text-text-light">
            <span>Readiness</span>
            <span>{readyScore}/3</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white">
            <div className="h-full rounded-full bg-grad transition-all" style={{ width: `${(readyScore / 3) * 100}%` }} />
          </div>
        </div>

        <Btn full onClick={onReview}>
          Mở hồ sơ duyệt
          <ArrowUpRight size={16} />
        </Btn>
      </div>
    </article>
  );
};

const StatCard = ({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  tone: 'amber' | 'green' | 'blue';
}) => {
  const toneClass = {
    amber: 'bg-amber-50 text-amber-700',
    green: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-sky-50 text-sky-700',
  }[tone];

  return (
    <Card className="p-5">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${toneClass}`}>{icon}</div>
        <div>
          <div className="text-xs font-black uppercase tracking-wider text-text-light">{label}</div>
          <div className="mt-1 text-2xl font-black text-text-dark">{value}</div>
        </div>
      </div>
    </Card>
  );
};

const ReviewFlag = ({ label, done }: { label: string; done: boolean }) => (
  <div className={`flex items-center justify-center gap-1.5 rounded-2xl px-2 py-2 text-[11px] font-black ${done ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
    {done ? <CheckCircle2 size={13} /> : <Clock3 size={13} />}
    {label}
  </div>
);

const InfoChip = ({ icon, label, value }: { icon: ReactNode; label: string; value: string }) => (
  <div className="rounded-2xl border border-lav-100 bg-white px-3.5 py-3">
    <div className="mb-1 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-text-light">
      {icon}
      {label}
    </div>
    <div className="truncate text-sm font-black text-text-dark">{value}</div>
  </div>
);

export default DoctorNurseReview;
