import { BriefcaseMedical, Filter, MapPin, Search, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchMotherNurses } from '../../api/motherNurseApi';
import Avatar from '../../components/common/Avatar';
import Btn from '../../components/common/Btn';
import Card from '../../components/common/Card';
import Pagination from '../../components/common/Pagination';
import Tag from '../../components/common/Tag';
import Topbar from '../../components/layout/Topbar';
import type { NurseSpecialty } from '../../types/nurseOnboarding';
import type { NursePublicProfile, PageResponse } from '../../types/nursePublic';
import { getApiErrorMessage } from '../../utils/apiError';

const specialtyLabel: Record<string, string> = {
  NURSE: 'Điều dưỡng',
  MIDWIFE: 'Hộ sinh',
  CAREGIVER: 'Chăm sóc sau sinh',
};

const availabilityLabel: Record<string, string> = {
  AVAILABLE: 'Sẵn sàng',
  BUSY: 'Đang bận',
  OFFLINE: 'Tạm nghỉ',
};

const getInitials = (name?: string) => {
  if (!name) return 'HB';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const emptyPage: PageResponse<NursePublicProfile> = {
  content: [],
  number: 0,
  size: 12,
  totalElements: 0,
  totalPages: 0,
};

const NurseCard = ({ nurse }: { nurse: NursePublicProfile }) => {
  const navigate = useNavigate();

  return (
    <Card className="flex h-full flex-col p-5">
      <div className="flex items-start gap-4">
        <Avatar initials={getInitials(nurse.fullName)} src={nurse.avatarUrl} size={58} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-[16px] font-black text-text-dark">{nurse.fullName || 'Nurse Happabi'}</h3>
              <p className="mt-1 text-[13px] font-bold text-text-mid">
                {specialtyLabel[nurse.specialty || ''] || 'Điều dưỡng'}
              </p>
            </div>
            {nurse.featured && <Tag variant="pink">Nổi bật</Tag>}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Tag variant={nurse.availabilityStatus === 'AVAILABLE' ? 'green' : 'gray'}>
              {availabilityLabel[nurse.availabilityStatus || ''] || 'Chưa cập nhật'}
            </Tag>
            {nurse.backgroundChecked && <Tag variant="purple">Đã kiểm tra</Tag>}
          </div>
        </div>
      </div>

      <p className="mt-4 line-clamp-3 min-h-[60px] text-[13px] font-semibold leading-5 text-text-mid">
        {nurse.bio || 'Nurse chưa cập nhật phần giới thiệu.'}
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-lav-100/45 p-3 text-center">
        <div>
          <div className="flex items-center justify-center gap-1 text-[13px] font-black text-text-dark">
            <Star size={14} className="fill-[#f59e0b] text-[#f59e0b]" />
            {nurse.ratingAvg ?? '0.0'}
          </div>
          <p className="mt-1 text-[10.5px] font-bold text-text-light">Đánh giá</p>
        </div>
        <div>
          <div className="text-[13px] font-black text-text-dark">{nurse.experienceYears ?? 0} năm</div>
          <p className="mt-1 text-[10.5px] font-bold text-text-light">Kinh nghiệm</p>
        </div>
        <div>
          <div className="text-[13px] font-black text-text-dark">{nurse.totalCompletedJobs ?? 0}</div>
          <p className="mt-1 text-[10.5px] font-bold text-text-light">Ca xong</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-[12px] font-bold text-text-light">
        <MapPin size={14} />
        <span className="truncate">{nurse.serviceArea || nurse.city || 'Chưa cập nhật khu vực'}</span>
      </div>

      <Btn className="mt-5" full onClick={() => navigate(`/mother/nurses/${nurse.profileId}`)}>
        Xem hồ sơ
      </Btn>
    </Card>
  );
};

const NurseSearch = () => {
  const [keyword, setKeyword] = useState('');
  const [city, setCity] = useState('');
  const [specialty, setSpecialty] = useState<NurseSpecialty | ''>('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [page, setPage] = useState(emptyPage);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const params = useMemo(() => ({
    keyword,
    city,
    specialty,
    availableOnly,
    page: currentPage,
    size: 12,
  }), [availableOnly, city, currentPage, keyword, specialty]);

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);
    setError('');

    searchMotherNurses(params)
      .then((data) => {
        if (!ignore) setPage(data || emptyPage);
      })
      .catch((err) => {
        if (!ignore) setError(getApiErrorMessage(err));
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [params]);

  const resetAndSetPage = (nextPage: number) => {
    setCurrentPage(nextPage);
  };

  return (
    <>
      <Topbar title="Tìm điều dưỡng" subtitle="Xem hồ sơ nurse đã được duyệt để chuẩn bị đặt lịch chăm sóc." />

      <Card className="mb-6">
        <div className="grid gap-3 lg:grid-cols-[1.2fr_.8fr_.7fr_auto_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light" size={17} />
            <input
              value={keyword}
              onChange={(event) => {
                setKeyword(event.target.value);
                resetAndSetPage(0);
              }}
              placeholder="Tìm theo tên, giới thiệu, khu vực..."
              className="h-11 w-full rounded-2xl border border-lav-200 bg-white pl-10 pr-3 text-[14px] font-bold outline-none focus:border-lav-acc focus:ring-4 focus:ring-lav-100"
            />
          </div>
          <input
            value={city}
            onChange={(event) => {
              setCity(event.target.value);
              resetAndSetPage(0);
            }}
            placeholder="Thành phố"
            className="h-11 rounded-2xl border border-lav-200 bg-white px-4 text-[14px] font-bold outline-none focus:border-lav-acc focus:ring-4 focus:ring-lav-100"
          />
          <select
            value={specialty}
            onChange={(event) => {
              setSpecialty(event.target.value as NurseSpecialty | '');
              resetAndSetPage(0);
            }}
            className="h-11 rounded-2xl border border-lav-200 bg-white px-4 text-[14px] font-bold outline-none focus:border-lav-acc focus:ring-4 focus:ring-lav-100"
          >
            <option value="">Tất cả chuyên môn</option>
            <option value="NURSE">Điều dưỡng</option>
            <option value="MIDWIFE">Hộ sinh</option>
            <option value="CAREGIVER">Chăm sóc sau sinh</option>
          </select>
          <label className="flex h-11 items-center gap-2 rounded-2xl border border-lav-200 bg-white px-4 text-[13px] font-black text-text-mid">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(event) => {
                setAvailableOnly(event.target.checked);
                resetAndSetPage(0);
              }}
            />
            Sẵn sàng
          </label>
          <div className="flex h-11 items-center gap-2 rounded-2xl bg-lav-100 px-4 text-[13px] font-black text-lav-dark">
            <Filter size={16} />
            {page.totalElements} hồ sơ
          </div>
        </div>
      </Card>

      {error && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-bold text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <Card className="flex min-h-[360px] items-center justify-center">
          <div className="text-center text-[14px] font-bold text-text-mid">Đang tải danh sách nurse...</div>
        </Card>
      ) : page.content.length ? (
        <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {page.content.map((nurse) => (
              <NurseCard key={nurse.profileId} nurse={nurse} />
            ))}
          </div>
          <Pagination
            currentPage={page.number}
            totalPages={page.totalPages}
            onPageChange={setCurrentPage}
            isLoading={isLoading}
          />
        </>
      ) : (
        <Card className="flex min-h-[300px] items-center justify-center text-center">
          <div>
            <BriefcaseMedical className="mx-auto text-lav-dark" size={34} />
            <p className="mt-3 text-[15px] font-black text-text-dark">Chưa có nurse phù hợp</p>
            <p className="mt-1 text-[13px] font-semibold text-text-mid">Thử bỏ bớt bộ lọc hoặc tìm theo khu vực khác.</p>
          </div>
        </Card>
      )}
    </>
  );
};

export default NurseSearch;
