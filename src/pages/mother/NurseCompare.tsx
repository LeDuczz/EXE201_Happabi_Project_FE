import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  Sparkles,
  Star,
  Stethoscope,
  X,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  compareMotherNursesWithAi,
  getMotherNurseProfile,
} from '../../api/motherNurseApi';
import Avatar from '../../components/common/Avatar';
import Btn from '../../components/common/Btn';
import Card from '../../components/common/Card';
import Tag from '../../components/common/Tag';
import Topbar from '../../components/layout/Topbar';
import type {
  NurseAiComparisonResponse,
  NurseComparisonCandidate,
  NursePublicProfile,
} from '../../types/nursePublic';
import { getApiErrorMessage } from '../../utils/apiError';

const specialtyLabel: Record<string, string> = {
  NURSE: 'Điều dưỡng',
  MIDWIFE: 'Hộ sinh',
  CAREGIVER: 'Chăm sóc sau sinh',
};

const getInitials = (name?: string) => {
  if (!name) return 'HB';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const formatNumber = (value?: number, fallback = '0') => {
  if (value === null || value === undefined) return fallback;
  return Number(value).toLocaleString('vi-VN', { maximumFractionDigits: 1 });
};

const findCandidate = (
  result: NurseAiComparisonResponse | null,
  profileId: string,
) => result?.candidates?.find((candidate) => candidate.profileId === profileId);

const parseIds = (value: string | null) => {
  if (!value) return [];
  return Array.from(new Set(value.split(',').map((item) => item.trim()).filter(Boolean))).slice(0, 2);
};

const NurseCompare = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialIds = useMemo(() => parseIds(searchParams.get('ids')), [searchParams]);
  const [selected, setSelected] = useState<NursePublicProfile[]>([]);
  const [careNeed, setCareNeed] = useState('');
  const [preference, setPreference] = useState('');
  const [comparison, setComparison] = useState<NurseAiComparisonResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isComparing, setIsComparing] = useState(false);
  const [error, setError] = useState('');
  const [compareError, setCompareError] = useState('');

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);
    setError('');
    setComparison(null);

    if (initialIds.length !== 2) {
      setSelected([]);
      setIsLoading(false);
      return;
    }

    Promise.all(initialIds.map((id) => getMotherNurseProfile(id)))
      .then((profiles) => {
        if (!ignore) setSelected(profiles.filter(Boolean));
      })
      .catch((err) => {
        if (!ignore) setError(getApiErrorMessage(err, 'Không tải được hồ sơ điều dưỡng để so sánh.'));
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [initialIds]);

  const canCompare = selected.length === 2 && !isComparing;

  const removeSelected = (profileId: string) => {
    const next = selected.filter((nurse) => nurse.profileId !== profileId);
    setSelected(next);
    setComparison(null);
    setCompareError('');
    if (next.length) {
      setSearchParams({ ids: next.map((nurse) => nurse.profileId).join(',') });
    } else {
      setSearchParams({});
    }
  };

  const runComparison = async () => {
    if (selected.length !== 2) {
      setCompareError('Vui lòng chọn đúng 2 điều dưỡng từ trang Tìm điều dưỡng.');
      return;
    }

    setIsComparing(true);
    setCompareError('');
    setComparison(null);

    try {
      const data = await compareMotherNursesWithAi({
        nurseProfileIds: selected.map((nurse) => nurse.profileId),
        careNeed: careNeed.trim() || undefined,
        preference: preference.trim() || undefined,
      });
      setComparison(data);
    } catch (err) {
      setCompareError(getApiErrorMessage(err, 'Không tạo được gợi ý AI. Vui lòng thử lại sau.'));
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <>
      <Topbar
        title="So sánh điều dưỡng"
        subtitle="Xem 2 hồ sơ đã chọn và để AI diễn giải lựa chọn phù hợp hơn cho mẹ."
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Btn variant="soft" onClick={() => navigate('/mother/search')}>
          <ArrowLeft size={16} />
          Quay lại tìm điều dưỡng
        </Btn>
        <div className="text-[12.5px] font-bold text-text-light">
          Chọn hồ sơ ở trang Tìm điều dưỡng để bắt đầu so sánh.
        </div>
      </div>

      {error && <ErrorNotice message={error} />}

      {isLoading ? (
        <Card className="flex min-h-[360px] items-center justify-center">
          <Loader2 className="animate-spin text-lav-dark" size={30} />
        </Card>
      ) : selected.length === 2 ? (
        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-[16px] font-semibold text-text-dark">Hồ sơ đang so sánh</div>
                <p className="mt-1 text-[13px] font-semibold text-text-mid">
                  Dữ liệu bên dưới lấy từ hồ sơ public đã được backend xác thực trạng thái ACTIVE.
                </p>
              </div>
              <Tag variant="purple">{selected.length}/2 hồ sơ</Tag>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {selected.map((nurse) => (
                <SelectedNurseCard
                  key={nurse.profileId}
                  nurse={nurse}
                  candidate={findCandidate(comparison, nurse.profileId)}
                  suggested={comparison?.suggestedProfileId === nurse.profileId}
                  onRemove={() => removeSelected(nurse.profileId)}
                />
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="block">
                <span className="text-[13px] font-semibold text-text-dark">Nhu cầu chăm sóc</span>
                <textarea
                  value={careNeed}
                  onChange={(event) => setCareNeed(event.target.value)}
                  rows={4}
                  maxLength={1000}
                  placeholder="Ví dụ: bé sơ sinh khó bú, mẹ cần hỗ trợ chăm rốn và theo dõi sau sinh..."
                  className="mt-2 w-full resize-none rounded-2xl border border-lav-200 bg-white px-4 py-3 text-[14px] font-semibold leading-6 text-text-dark outline-none focus:border-lav-acc focus:ring-4 focus:ring-lav-100"
                />
              </label>
              <label className="block">
                <span className="text-[13px] font-semibold text-text-dark">Ưu tiên của mẹ</span>
                <textarea
                  value={preference}
                  onChange={(event) => setPreference(event.target.value)}
                  rows={4}
                  maxLength={500}
                  placeholder="Ví dụ: ưu tiên kinh nghiệm, đánh giá tốt, lịch rảnh sớm hoặc cùng khu vực..."
                  className="mt-2 w-full resize-none rounded-2xl border border-lav-200 bg-white px-4 py-3 text-[14px] font-semibold leading-6 text-text-dark outline-none focus:border-lav-acc focus:ring-4 focus:ring-lav-100"
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[12.5px] font-semibold text-text-light">
                AI chỉ diễn giải dữ liệu hồ sơ public và không thay thế quyết định của mẹ.
              </p>
              <Btn onClick={runComparison} disabled={!canCompare}>
                {isComparing ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                Phân tích với AI
              </Btn>
            </div>
          </Card>

          {compareError && <ErrorNotice message={compareError} />}

          {comparison && <AiResultPanel comparison={comparison} />}
        </div>
      ) : (
        <Card className="flex min-h-[340px] items-center justify-center text-center">
          <div>
            <Stethoscope className="mx-auto text-lav-dark" size={34} />
            <p className="mt-3 text-[16px] font-semibold text-text-dark">Chưa đủ 2 hồ sơ để so sánh</p>
            <p className="mt-1 text-[13px] font-semibold text-text-mid">
              Mẹ hãy quay lại trang tìm điều dưỡng và chọn 2 hồ sơ phù hợp.
            </p>
            <Btn className="mt-5" onClick={() => navigate('/mother/search')}>
              Chọn điều dưỡng
            </Btn>
          </div>
        </Card>
      )}
    </>
  );
};

interface SelectedNurseCardProps {
  nurse: NursePublicProfile;
  candidate?: NurseComparisonCandidate;
  suggested: boolean;
  onRemove: () => void;
}

const SelectedNurseCard = ({ nurse, candidate, suggested, onRemove }: SelectedNurseCardProps) => (
  <div className={`relative rounded-2xl border p-4 ${
    suggested ? 'border-lav-acc bg-lav-100/70' : 'border-lav-200 bg-white'
  }`}>
    <button
      type="button"
      onClick={onRemove}
      className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-xl bg-white text-text-light shadow-sm transition-colors hover:text-danger"
      aria-label="Bỏ chọn điều dưỡng"
    >
      <X size={16} />
    </button>

    <div className="flex items-start gap-3 pr-9">
      <Avatar initials={getInitials(nurse.fullName)} src={nurse.avatarUrl} size={54} />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-[16px] font-semibold text-text-dark">{nurse.fullName || 'Điều dưỡng Happabi'}</h3>
          {suggested && <Tag variant="grad">Gợi ý phù hợp</Tag>}
        </div>
        <p className="mt-1 text-[13px] font-bold text-text-mid">
          {specialtyLabel[nurse.specialty || ''] || 'Điều dưỡng'}
        </p>
      </div>
    </div>

    <p className="mt-4 line-clamp-3 min-h-[60px] text-[13px] font-semibold leading-5 text-text-mid">
      {nurse.bio || 'Điều dưỡng chưa cập nhật phần giới thiệu.'}
    </p>

    <div className="mt-4 grid grid-cols-2 gap-2">
      <Metric label="Đánh giá" value={`${formatNumber(nurse.ratingAvg)} sao`} icon={<Star size={14} />} />
      <Metric label="Kinh nghiệm" value={`${nurse.experienceYears ?? 0} năm`} />
      <Metric label="Ca hoàn thành" value={formatNumber(nurse.totalCompletedJobs)} />
      <Metric label="Điểm phù hợp" value={candidate?.fitScore !== undefined ? `${candidate.fitScore}/100` : 'Chờ AI'} />
    </div>

    <div className="mt-4 rounded-2xl bg-lav-100/55 p-3">
      <div className="text-[12px] font-semibold text-text-dark">Điểm mạnh</div>
      <ListText items={candidate?.strengths} fallback="Sẽ hiển thị sau khi phân tích AI." />
    </div>

    <div className="mt-3 rounded-2xl bg-slate-50 p-3">
      <div className="text-[12px] font-semibold text-text-dark">Cần hỏi thêm</div>
      <ListText items={candidate?.watchPoints} fallback="Sẽ hiển thị sau khi phân tích AI." />
    </div>
  </div>
);

const Metric = ({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) => (
  <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
    <div className="flex items-center justify-center gap-1 text-[13px] font-semibold text-text-dark">
      {icon}
      {value}
    </div>
    <div className="mt-1 text-[10.5px] font-bold text-text-light">{label}</div>
  </div>
);

const ListText = ({ items, fallback }: { items?: string[]; fallback: string }) => {
  const visibleItems = items?.filter(Boolean) ?? [];
  if (!visibleItems.length) {
    return <p className="mt-1 text-[12px] font-semibold leading-5 text-text-mid">{fallback}</p>;
  }
  return (
    <ul className="mt-1 space-y-1 text-[12px] font-semibold leading-5 text-text-mid">
      {visibleItems.map((item) => (
        <li key={item}>- {item}</li>
      ))}
    </ul>
  );
};

const AiResultPanel = ({ comparison }: { comparison: NurseAiComparisonResponse }) => (
  <Card className="border-lav-300 bg-lav-100/45 p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-grad text-white">
          <Sparkles size={18} />
        </span>
        <div>
          <div className="text-[16px] font-semibold text-text-dark">
            {comparison.aiGenerated ? 'AI gợi ý cho mẹ' : 'Gợi ý dựa trên dữ liệu hồ sơ'}
          </div>
          <div className="text-[12px] font-bold text-text-light">
            {comparison.suggestedNurseName ? `Ưu tiên: ${comparison.suggestedNurseName}` : 'Dựa trên dữ liệu so sánh hiện có'}
          </div>
        </div>
      </div>
    </div>

    <p className="mt-4 whitespace-pre-line text-[14px] font-semibold leading-7 text-text-dark">
      {comparison.summary || 'Chưa có nội dung gợi ý.'}
    </p>
  </Card>
);

const ErrorNotice = ({ message }: { message: string }) => (
  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-bold leading-5 text-red-700">
    <div className="flex items-start gap-2">
      <AlertCircle size={16} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  </div>
);

export default NurseCompare;
