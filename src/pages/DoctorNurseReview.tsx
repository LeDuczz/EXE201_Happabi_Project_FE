import { AlertCircle, ChevronRight, Clock3, Loader2, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Btn from '../components/common/Btn';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Topbar from '../components/layout/Topbar';
import type { NurseOnboarding } from '../types/nurseOnboarding';
import { getApiErrorMessage } from '../utils/apiError';

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
      const haystack = `${item.fullName || ''} ${item.phone || ''} ${item.email || ''} ${item.city || ''}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [items, query]);

  const loadPending = async () => {
    setError('');
    setIsLoading(true);
    try {
      const response = await axiosClient.get('/api/v1/doctor/nurses/pending-review');
      setItems(response.data?.data || []);
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Không tải được danh sách hồ sơ nurse chờ duyệt.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPending();
  }, []);

  return (
    <>
      <Topbar
        title="Duyệt hồ sơ nurse"
        subtitle="Danh sách nurse đã nộp đủ hồ sơ và đang chờ doctor kiểm tra."
      />

      {error && (
        <div className="mb-5 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Card className="p-0">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-lav-100 p-5">
          <div>
            <div className="text-lg font-semibold text-text-dark">Hồ sơ cần duyệt</div>
            <div className="mt-1 text-sm font-semibold text-text-light">{items.length} hồ sơ đang chờ</div>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[460px] sm:flex-row">
            <Input
              placeholder="Tìm theo tên, SĐT, email, thành phố"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              icon={<Search size={16} />}
            />
            <Btn variant="soft" onClick={loadPending} disabled={isLoading} className="shrink-0">
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} /> Tải lại
            </Btn>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-[420px] items-center justify-center">
            <Loader2 className="animate-spin text-lav-dark" size={34} />
          </div>
        ) : (
          <div className="p-5">
            <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {filteredItems.map((item) => (
                <NurseReviewCard
                  key={item.profileId}
                  item={item}
                  onReview={() => navigate(`/doctor/nurses/review/${item.profileId}`)}
                />
              ))}
            </div>

            {!filteredItems.length && (
              <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-lav-100 bg-[#fff9fb] text-center">
                <div>
                  <ShieldCheck className="mx-auto mb-3 text-lav-dark" size={40} />
                  <div className="font-semibold text-text-dark">Không có hồ sơ nào đang chờ duyệt</div>
                  <div className="mt-2 text-sm font-semibold text-text-light">Khi nurse submit hồ sơ, hệ thống sẽ hiển thị tại đây.</div>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </>
  );
};

const NurseReviewCard = ({ item, onReview }: { item: NurseOnboarding; onReview: () => void }) => (
  <div className="rounded-2xl border border-lav-100 bg-white p-5 shadow-[0_4px_18px_rgba(168,85,247,0.06)]">
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <div className="text-lg font-semibold text-text-dark">{item.fullName || 'Nurse chưa có tên'}</div>
        <div className="mt-1 text-sm font-semibold text-text-light">{item.phone || item.email || 'Chưa có liên hệ'}</div>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700">
        <Clock3 size={13} /> Chờ duyệt
      </span>
    </div>

    <div className="grid gap-3 sm:grid-cols-2">
      <MiniInfo label="Thành phố" value={item.city} />
      <MiniInfo label="Chuyên môn" value={item.specialty} />
      <MiniInfo label="Kinh nghiệm" value={`${item.experienceYears ?? 0} năm`} />
      <MiniInfo label="Chứng chỉ" value={`${item.certificationCount ?? item.certifications?.length ?? 0}`} />
    </div>

    <div className="mt-4 grid grid-cols-3 gap-2">
      <ProgressFlag label="Profile" done={Boolean(item.profileCompleted)} />
      <ProgressFlag label="KYC" done={Boolean(item.kycCompleted)} />
      <ProgressFlag label="Cert" done={Boolean(item.certificationsCompleted)} />
    </div>

    <Btn full className="mt-5" onClick={onReview}>
      Duyệt <ChevronRight size={16} />
    </Btn>
  </div>
);

const MiniInfo = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div className="rounded-xl bg-[#fff9fb] px-3.5 py-3">
    <div className="text-[11px] font-semibold uppercase tracking-wide text-text-light">{label}</div>
    <div className="mt-1 truncate text-sm font-bold text-text-dark">{value || '-'}</div>
  </div>
);

const ProgressFlag = ({ label, done }: { label: string; done: boolean }) => (
  <div className={`rounded-xl px-2.5 py-2 text-center text-[11px] font-semibold ${done ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
    {label}
  </div>
);

export default DoctorNurseReview;
