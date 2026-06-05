import { ArrowLeft, BadgeCheck, BriefcaseMedical, CalendarPlus, CheckCircle2, FileBadge, MapPin, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMotherNurseProfile } from '../../api/motherNurseApi';
import Avatar from '../../components/common/Avatar';
import Btn from '../../components/common/Btn';
import Card from '../../components/common/Card';
import Tag from '../../components/common/Tag';
import Topbar from '../../components/layout/Topbar';
import type { NursePublicProfile as NursePublicProfileType } from '../../types/nursePublic';
import { getApiErrorMessage } from '../../utils/apiError';

const specialtyLabel: Record<string, string> = {
  NURSE: 'Điều dưỡng',
  MIDWIFE: 'Hộ sinh',
  CAREGIVER: 'Chăm sóc sau sinh',
};

const availabilityLabel: Record<string, string> = {
  AVAILABLE: 'Sẵn sàng nhận lịch',
  BUSY: 'Đang bận',
  OFFLINE: 'Tạm nghỉ',
};

const getInitials = (name?: string) => {
  if (!name) return 'HB';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const InfoMetric = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded-2xl border border-lav-100 bg-white p-4 text-center">
    <p className="font-serif text-[26px] font-black text-grad">{value}</p>
    <p className="mt-1 text-[12px] font-bold text-text-light">{label}</p>
  </div>
);

const NursePublicProfile = () => {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<NursePublicProfileType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!profileId) return;

    let ignore = false;
    setIsLoading(true);
    setError('');

    getMotherNurseProfile(profileId)
      .then((data) => {
        if (!ignore) setProfile(data);
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
  }, [profileId]);

  return (
    <>
      <Topbar title="Hồ sơ điều dưỡng" subtitle="Thông tin public của nurse đã được Happabi duyệt." />

      <button
        type="button"
        onClick={() => navigate('/mother/search')}
        className="mb-5 inline-flex items-center gap-2 text-[13px] font-black text-lav-dark"
      >
        <ArrowLeft size={16} />
        Quay lại danh sách
      </button>

      {error && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-bold text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <Card className="flex min-h-[420px] items-center justify-center">
          <p className="text-[14px] font-bold text-text-mid">Đang tải hồ sơ nurse...</p>
        </Card>
      ) : profile ? (
        <div className="space-y-6">
          <Card className="overflow-hidden p-0">
            <div className="bg-gradient-to-r from-lav-100 via-white to-pink-100 p-6">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-5">
                  <Avatar initials={getInitials(profile.fullName)} src={profile.avatarUrl} size={112} />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-serif text-[34px] font-black leading-tight text-text-dark">
                        {profile.fullName || 'Nurse Happabi'}
                      </h2>
                      {profile.featured && <Tag variant="pink">Nổi bật</Tag>}
                    </div>
                    <p className="mt-1 text-[14px] font-bold text-text-mid">
                      {specialtyLabel[profile.specialty || ''] || 'Điều dưỡng'} · {profile.experienceYears ?? 0} năm kinh nghiệm
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Tag variant={profile.availabilityStatus === 'AVAILABLE' ? 'green' : 'gray'}>
                        {availabilityLabel[profile.availabilityStatus || ''] || 'Chưa cập nhật lịch'}
                      </Tag>
                      {profile.backgroundChecked && <Tag variant="purple">Đã kiểm tra nền tảng</Tag>}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/80 bg-white/85 p-4 lg:w-[260px]">
                  <p className="text-[12px] font-bold text-text-light">Bước tiếp theo</p>
                  <p className="mt-1 text-[14px] font-black text-text-dark">Xem hồ sơ và chuẩn bị đặt lịch chăm sóc.</p>
                  <Btn full className="mt-4" onClick={() => navigate('/mother/bookings')}>
                    <CalendarPlus size={16} />
                    Đặt lịch
                  </Btn>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-4">
            <InfoMetric label="Điểm đánh giá" value={profile.ratingAvg ?? '0.0'} />
            <InfoMetric label="Lượt đánh giá" value={profile.totalReviews ?? 0} />
            <InfoMetric label="Ca hoàn thành" value={profile.totalCompletedJobs ?? 0} />
            <InfoMetric label="Chứng chỉ" value={profile.certificationCount ?? 0} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.3fr_.9fr]">
            <Card>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-lav-100 text-lav-dark">
                  <BriefcaseMedical size={20} />
                </div>
                <h3 className="font-serif text-[24px] font-black text-text-dark">Giới thiệu</h3>
              </div>
              <p className="text-[14px] font-bold leading-7 text-text-mid">
                {profile.bio || 'Nurse chưa cập nhật phần giới thiệu.'}
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-lav-100 bg-white p-4">
                  <div className="mb-1 flex items-center gap-2 text-[12px] font-bold text-text-light">
                    <MapPin size={14} />
                    Khu vực phục vụ
                  </div>
                  <p className="text-[14px] font-black text-text-dark">{profile.serviceArea || 'Chưa cập nhật'}</p>
                </div>
                <div className="rounded-2xl border border-lav-100 bg-white p-4">
                  <div className="mb-1 flex items-center gap-2 text-[12px] font-bold text-text-light">
                    <BadgeCheck size={14} />
                    Thành phố
                  </div>
                  <p className="text-[14px] font-black text-text-dark">{profile.city || 'Chưa cập nhật'}</p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-100 text-pink-dark">
                  <FileBadge size={20} />
                </div>
                <h3 className="font-serif text-[24px] font-black text-text-dark">Chứng chỉ đã xác minh</h3>
              </div>

              {profile.certifications?.length ? (
                <div className="space-y-3">
                  {profile.certifications.map((certification) => (
                    <div key={certification.id} className="rounded-2xl border border-lav-100 bg-white p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 text-verified" size={18} />
                        <div>
                          <p className="text-[14px] font-black text-text-dark">{certification.certName}</p>
                          <p className="mt-1 text-[12px] font-bold text-text-mid">{certification.issuedBy}</p>
                          <p className="mt-1 text-[11px] font-bold text-text-light">
                            {certification.issuedDate || 'Chưa có ngày cấp'} - {certification.expiryDate || 'Không thời hạn'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl border border-dashed border-lav-200 bg-lav-100/40 p-5 text-center text-[13px] font-bold text-text-mid">
                  Chưa có chứng chỉ public.
                </p>
              )}
            </Card>
          </div>
        </div>
      ) : (
        <Card className="text-center">
          <Star className="mx-auto text-lav-dark" size={30} />
          <p className="mt-3 text-[14px] font-bold text-text-mid">Không tìm thấy hồ sơ nurse.</p>
        </Card>
      )}
    </>
  );
};

export default NursePublicProfile;
