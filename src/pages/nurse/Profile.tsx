import {
  BadgeCheck,
  BriefcaseMedical,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  FileBadge,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Star,
  UserRound,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyNurseProfile, updateMyNurseProfileDisplay, uploadMyAvatar } from '../../api/nurseProfileApi';
import Btn from '../../components/common/Btn';
import Card from '../../components/common/Card';
import Topbar from '../../components/layout/Topbar';
import { useAuth } from '../../contexts/AuthContext';
import type { NurseCertification } from '../../types/nurseOnboarding';
import type { AvailabilityStatus, NurseProfile as NurseProfileType } from '../../types/nurseProfile';
import { getApiErrorMessage } from '../../utils/apiError';

const emptyProfile: NurseProfileType = {
  id: '',
  fullName: '',
  phone: '',
  email: '',
  avatarUrl: '',
  certifications: [],
};

interface DisplayForm {
  bio: string;
  serviceArea: string;
  availabilityStatus: AvailabilityStatus;
}

const nurseStatusLabel: Record<string, string> = {
  PENDING_SUBMIT: 'Đang nhập hồ sơ',
  PENDING_REVIEW: 'Chờ doctor duyệt',
  REJECTED: 'Cần bổ sung',
  APPROVED_PENDING_CONTRACT: 'Chờ ký hợp đồng',
  ACTIVE: 'Đang hoạt động',
  SUSPENDED: 'Tạm khóa',
};

const availabilityLabel: Record<string, string> = {
  AVAILABLE: 'Sẵn sàng nhận lịch',
  BUSY: 'Đang bận',
  OFFLINE: 'Tạm nghỉ',
};

const specialtyLabel: Record<string, string> = {
  NURSE: 'Điều dưỡng',
  MIDWIFE: 'Hộ sinh',
  CAREGIVER: 'Chăm sóc sau sinh',
};

const kycStatusLabel: Record<string, string> = {
  PENDING: 'Chờ kiểm tra',
  PASSED: 'Đã xác minh',
  REVIEW_NEEDED: 'Cần kiểm tra lại',
  FAILED: 'Không đạt',
};

const contractStatusLabel: Record<string, string> = {
  PENDING: 'Chờ ký',
  SIGNED: 'Đã ký',
  CANCELLED: 'Đã hủy',
};

const formatValue = (value?: string | number | null) => {
  if (value === undefined || value === null || value === '') return 'Chưa cập nhật';
  return String(value);
};

const formatPercent = (value?: number) => {
  if (value === undefined || value === null) return '0%';
  return `${Math.round(Number(value) * 100) / 100}%`;
};

const getInitials = (name?: string) => {
  if (!name) return 'HB';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const StatusPill = ({
  label,
  tone = 'lavender',
}: {
  label: string;
  tone?: 'lavender' | 'green' | 'amber' | 'red' | 'slate';
}) => {
  const tones = {
    lavender: 'border-lav-200 bg-lav-100 text-lav-dark',
    green: 'border-green-200 bg-green-50 text-green-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    red: 'border-red-200 bg-red-50 text-red-700',
    slate: 'border-slate-200 bg-slate-50 text-slate-600',
  };

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-[12px] font-extrabold ${tones[tone]}`}>
      {label}
    </span>
  );
};

const statusTone = (status?: string) => {
  if (status === 'ACTIVE' || status === 'PASSED' || status === 'SIGNED' || status === 'AVAILABLE') return 'green';
  if (status === 'REJECTED' || status === 'FAILED' || status === 'SUSPENDED' || status === 'CANCELLED') return 'red';
  if (status === 'PENDING_REVIEW' || status === 'APPROVED_PENDING_CONTRACT' || status === 'REVIEW_NEEDED' || status === 'PENDING') return 'amber';
  return 'slate';
};

const InfoRow = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div className="rounded-2xl border border-lav-100 bg-white px-4 py-3">
    <p className="text-[12px] font-bold text-text-light">{label}</p>
    <p className="mt-1 text-[14px] font-extrabold text-text-dark">{formatValue(value)}</p>
  </div>
);

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="text-[12px] font-black uppercase tracking-[0.03em] text-text-light">
    {children}
  </label>
);

const MetricCard = ({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) => (
  <div className="rounded-[18px] border border-lav-100 bg-white p-5 shadow-[0_4px_18px_rgba(168,85,247,0.06)]">
    <div className="flex items-center justify-between">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lav-100 text-lav-dark">
        {icon}
      </div>
      <span className="text-[12px] font-bold text-text-light">{hint}</span>
    </div>
    <p className="mt-4 text-[24px] font-black text-text-dark">{value}</p>
    <p className="text-[13px] font-bold text-text-mid">{label}</p>
  </div>
);

const VerificationItem = ({
  title,
  description,
  checked,
  status,
}: {
  title: string;
  description: string;
  checked?: boolean;
  status?: string;
}) => (
  <div className="flex items-start gap-3 rounded-2xl border border-lav-100 bg-white p-4">
    <div className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-full ${checked ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
      {checked ? <CheckCircle2 size={18} /> : <RefreshCw size={17} />}
    </div>
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[14px] font-black text-text-dark">{title}</p>
        {status && <StatusPill label={status} tone={checked ? 'green' : 'amber'} />}
      </div>
      <p className="mt-1 text-[12.5px] font-semibold leading-5 text-text-mid">{description}</p>
    </div>
  </div>
);

const CertificationCard = ({ certification }: { certification: NurseCertification }) => (
  <div className="rounded-2xl border border-lav-100 bg-white p-4">
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="truncate text-[15px] font-black text-text-dark">
          {certification.certName || 'Chứng chỉ điều dưỡng'}
        </p>
        <p className="mt-1 text-[12.5px] font-bold text-text-mid">
          {certification.issuedBy || 'Chưa cập nhật đơn vị cấp'}
        </p>
      </div>
      <StatusPill
        label={certification.verified ? 'Đã xác minh' : 'Chờ xác minh'}
        tone={certification.verified ? 'green' : 'amber'}
      />
    </div>
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <InfoRow label="Ngày cấp" value={certification.issuedDate} />
      <InfoRow label="Ngày hết hạn" value={certification.expiryDate} />
    </div>
  </div>
);

const NurseProfile = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { refreshMe } = useAuth();
  const [profile, setProfile] = useState<NurseProfileType>(emptyProfile);
  const [displayForm, setDisplayForm] = useState<DisplayForm>({
    bio: '',
    serviceArea: '',
    availabilityStatus: 'OFFLINE',
  });
  const [isEditingDisplay, setIsEditingDisplay] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingDisplay, setIsSavingDisplay] = useState(false);
  const [isSavingAvailability, setIsSavingAvailability] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const syncDisplayForm = (data: NurseProfileType) => {
    setDisplayForm({
      bio: data.bio || '',
      serviceArea: data.serviceArea || '',
      availabilityStatus: data.availabilityStatus || 'OFFLINE',
    });
  };

  const loadProfile = async () => {
    setError('');
    setIsLoading(true);
    try {
      const data = await getMyNurseProfile();
      setProfile({ ...emptyProfile, ...data, certifications: data?.certifications ?? [] });
      syncDisplayForm(data || emptyProfile);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const completionItems = useMemo(() => {
    const items = [
      Boolean(profile.profileCompleted),
      Boolean(profile.kycVerified),
      Boolean(profile.certificationsCompleted),
      Boolean(profile.contractSigned),
    ];
    return {
      done: items.filter(Boolean).length,
      total: items.length,
    };
  }, [profile.certificationsCompleted, profile.contractSigned, profile.kycVerified, profile.profileCompleted]);

  const uploadAvatar = async (file: File) => {
    setError('');
    setSuccess('');
    setIsUploadingAvatar(true);

    try {
      const avatarUrl = await uploadMyAvatar(file);
      setProfile((current) => ({ ...current, avatarUrl }));
      await refreshMe();
      setSuccess('Ảnh đại diện đã được cập nhật.');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const cancelDisplayEdit = () => {
    syncDisplayForm(profile);
    setIsEditingDisplay(false);
    setError('');
    setSuccess('');
  };

  const saveDisplayProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSavingDisplay(true);

    try {
      const data = await updateMyNurseProfileDisplay({
        bio: displayForm.bio.trim(),
        serviceArea: displayForm.serviceArea.trim(),
      });
      const nextProfile = { ...emptyProfile, ...data, certifications: data?.certifications ?? [] };
      setProfile(nextProfile);
      syncDisplayForm(nextProfile);
      setIsEditingDisplay(false);
      setSuccess('Thông tin hiển thị đã được cập nhật.');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSavingDisplay(false);
    }
  };

  const saveAvailabilityStatus = async () => {
    setError('');
    setSuccess('');
    setIsSavingAvailability(true);

    try {
      const data = await updateMyNurseProfileDisplay({
        availabilityStatus: displayForm.availabilityStatus,
      });
      const nextProfile = { ...emptyProfile, ...data, certifications: data?.certifications ?? [] };
      setProfile(nextProfile);
      syncDisplayForm(nextProfile);
      setSuccess('Trạng thái nhận lịch đã được cập nhật.');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSavingAvailability(false);
    }
  };

  return (
    <>
      <Topbar title="Hồ sơ nurse" subtitle="Theo dõi thông tin hiển thị, trạng thái duyệt và hồ sơ nghề nghiệp của bạn." />

      {error && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-bold text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-[13px] font-bold text-green-700">
          {success}
        </div>
      )}

      {isLoading ? (
        <Card className="flex min-h-[420px] items-center justify-center">
          <div className="text-center">
            <RefreshCw className="mx-auto animate-spin text-lav-dark" size={34} />
            <p className="mt-3 text-[14px] font-bold text-text-mid">Đang tải hồ sơ nurse...</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="overflow-hidden p-0">
            <div className="bg-gradient-to-r from-lav-100 via-white to-pink-100 p-6">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-5">
                  <div className="relative h-28 w-28 shrink-0">
                    <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-grad text-3xl font-black text-white shadow-[0_12px_32px_rgba(168,85,247,.25)]">
                      {profile.avatarUrl ? (
                        <img src={profile.avatarUrl} alt={profile.fullName || 'Avatar'} className="h-full w-full object-cover" />
                      ) : (
                        getInitials(profile.fullName)
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-dark-200 text-white shadow-lg disabled:opacity-60"
                      aria-label="Cập nhật avatar"
                    >
                      <Camera size={16} />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) uploadAvatar(file);
                      }}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate font-serif text-[32px] font-black leading-tight text-text-dark">
                        {profile.fullName || 'Nurse Happabi'}
                      </h2>
                      {profile.featured && <StatusPill label="Nổi bật" tone="lavender" />}
                    </div>
                    <p className="mt-1 text-[14px] font-bold text-text-mid">
                      {formatValue(profile.phone)} · {formatValue(profile.email)}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <StatusPill
                        label={nurseStatusLabel[profile.nurseStatus || ''] || 'Chưa có trạng thái'}
                        tone={statusTone(profile.nurseStatus)}
                      />
                      <StatusPill
                        label={availabilityLabel[profile.availabilityStatus || ''] || 'Chưa cập nhật lịch'}
                        tone={statusTone(profile.availabilityStatus)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 lg:min-w-[280px]">
                  <div className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[12px] font-bold text-text-light">Trạng thái nhận lịch</p>
                        <p className="mt-1 text-[13px] font-black text-text-dark">
                          {availabilityLabel[profile.availabilityStatus || ''] || 'Chưa cập nhật lịch'}
                        </p>
                      </div>
                      <StatusPill
                        label={availabilityLabel[profile.availabilityStatus || ''] || 'Chưa cập nhật'}
                        tone={statusTone(profile.availabilityStatus)}
                      />
                    </div>

                    <div className="mt-3 flex gap-2">
                      <select
                        value={displayForm.availabilityStatus}
                        onChange={(event) => setDisplayForm((current) => ({
                          ...current,
                          availabilityStatus: event.target.value as AvailabilityStatus,
                        }))}
                        className="min-w-0 flex-1 rounded-xl border border-lav-200 bg-white px-3 py-2 text-[13px] font-bold text-text-dark outline-none transition focus:border-lav-acc focus:ring-4 focus:ring-lav-100"
                      >
                        <option value="AVAILABLE">Sẵn sàng nhận lịch</option>
                        <option value="BUSY">Đang bận</option>
                        <option value="OFFLINE">Tạm nghỉ</option>
                      </select>
                      <Btn
                        type="button"
                        size="sm"
                        onClick={saveAvailabilityStatus}
                        disabled={isSavingAvailability || displayForm.availabilityStatus === profile.availabilityStatus}
                      >
                        {isSavingAvailability ? 'Lưu...' : 'Lưu'}
                      </Btn>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-3 rounded-2xl border border-white/80 bg-white/80 p-4">
                  <p className="text-[12px] font-bold text-text-light">Hoàn tất hồ sơ</p>
                  <div className="flex w-full items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-lav-100">
                      <div
                        className="h-full rounded-full bg-grad"
                        style={{ width: `${(completionItems.done / completionItems.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-[13px] font-black text-text-dark">
                      {completionItems.done}/{completionItems.total}
                    </span>
                  </div>
                  {profile.canEditProfessionalInfo && (
                    <Link to="/nurse/onboarding" className="w-full">
                      <Btn full size="sm">
                        Cập nhật onboarding
                      </Btn>
                    </Link>
                  )}
                </div>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
            <MetricCard icon={<Star size={20} />} label="Điểm đánh giá" value={String(profile.ratingAvg ?? '0.0')} hint={`${profile.totalReviews ?? 0} đánh giá`} />
            <MetricCard icon={<ClipboardCheck size={20} />} label="Ca đã hoàn thành" value={String(profile.totalCompletedJobs ?? 0)} hint="Happabi" />
            <MetricCard icon={<BadgeCheck size={20} />} label="Tỷ lệ phản hồi" value={formatPercent(profile.responseRate)} hint="Hiệu suất" />
            <MetricCard icon={<ShieldCheck size={20} />} label="Xác minh nền tảng" value={profile.backgroundChecked ? 'Đạt' : 'Chờ'} hint="An toàn" />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.35fr_.9fr]">
            <Card>
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-lav-100 text-lav-dark">
                    <BriefcaseMedical size={20} />
                  </div>
                  <div>
                    <h3 className="font-serif text-[23px] font-black text-text-dark">Thông tin nghề nghiệp</h3>
                    <p className="text-[13px] font-semibold text-text-light">Các thông tin này được dùng để mother xem và đặt lịch sau này.</p>
                  </div>
                </div>
                {!isEditingDisplay && (
                  <Btn variant="soft" size="sm" onClick={() => setIsEditingDisplay(true)}>
                    Chỉnh sửa hiển thị
                  </Btn>
                )}
              </div>

              <form onSubmit={saveDisplayProfile}>
                <div className="grid gap-4 md:grid-cols-2">
                  <InfoRow label="Mã giấy phép" value={profile.licenseNumber} />
                  <InfoRow label="Chuyên môn" value={specialtyLabel[profile.specialty || '']} />
                  <InfoRow label="Kinh nghiệm" value={profile.experienceYears === undefined ? undefined : `${profile.experienceYears} năm`} />
                  <InfoRow label="Ngày sinh" value={profile.dayOfBirth} />
                  <InfoRow label="Thành phố" value={profile.city} />

                  <div className="rounded-2xl border border-lav-100 bg-white px-4 py-3">
                    <FieldLabel>Khu vực phục vụ</FieldLabel>
                    {isEditingDisplay ? (
                      <input
                        value={displayForm.serviceArea}
                        maxLength={200}
                        onChange={(event) => setDisplayForm((current) => ({ ...current, serviceArea: event.target.value }))}
                        className="mt-2 w-full rounded-xl border border-lav-200 bg-white px-3 py-2 text-[14px] font-bold text-text-dark outline-none transition focus:border-lav-acc focus:ring-4 focus:ring-lav-100"
                        placeholder="Ví dụ: Quận 1, Quận 3, Bình Thạnh"
                      />
                    ) : (
                      <p className="mt-1 text-[14px] font-extrabold text-text-dark">{formatValue(profile.serviceArea)}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-lav-100 bg-white px-4 py-3">
                  <div className="mb-1 flex items-center gap-2 text-[12px] font-bold text-text-light">
                    <MapPin size={14} />
                    Địa chỉ
                  </div>
                  <p className="text-[14px] font-extrabold leading-6 text-text-dark">{formatValue(profile.address)}</p>
                </div>

                <div className="mt-4 rounded-2xl border border-lav-100 bg-white px-4 py-3">
                  <div className="mb-1 flex items-center gap-2 text-[12px] font-bold text-text-light">
                    <UserRound size={14} />
                    Giới thiệu
                  </div>
                  {isEditingDisplay ? (
                    <>
                      <textarea
                        value={displayForm.bio}
                        maxLength={2000}
                        rows={5}
                        onChange={(event) => setDisplayForm((current) => ({ ...current, bio: event.target.value }))}
                        className="mt-2 w-full resize-none rounded-xl border border-lav-200 bg-white px-3 py-2 text-[14px] font-bold leading-6 text-text-dark outline-none transition focus:border-lav-acc focus:ring-4 focus:ring-lav-100"
                        placeholder="Giới thiệu ngắn về kinh nghiệm, phong cách chăm sóc và điểm mạnh của bạn"
                      />
                      <p className="mt-1 text-right text-[11px] font-bold text-text-light">
                        {displayForm.bio.length}/2000
                      </p>
                    </>
                  ) : (
                    <p className="text-[14px] font-bold leading-6 text-text-mid">{formatValue(profile.bio)}</p>
                  )}
                </div>

                {isEditingDisplay && (
                  <div className="mt-5 flex flex-wrap justify-end gap-3">
                    <Btn type="button" variant="ghost" onClick={cancelDisplayEdit} disabled={isSavingDisplay}>
                      Hủy
                    </Btn>
                    <Btn type="submit" disabled={isSavingDisplay}>
                      {isSavingDisplay ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </Btn>
                  </div>
                )}
              </form>
            </Card>

            <Card>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-100 text-pink-dark">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="font-serif text-[23px] font-black text-text-dark">Xác minh</h3>
                  <p className="text-[13px] font-semibold text-text-light">Trạng thái duyệt từ doctor và hệ thống.</p>
                </div>
              </div>

              <div className="space-y-3">
                <VerificationItem
                  title="Thông tin cá nhân"
                  description="Họ tên, ngày sinh, địa chỉ, chuyên môn và kinh nghiệm."
                  checked={profile.profileCompleted}
                  status={profile.profileCompleted ? 'Đã đủ' : 'Thiếu thông tin'}
                />
                <VerificationItem
                  title="CCCD / KYC"
                  description={`Mặt trước: ${profile.kycHasFrontImage ? 'đã có' : 'chưa có'} · Mặt sau: ${profile.kycHasBackImage ? 'đã có' : 'chưa có'}`}
                  checked={profile.kycVerified}
                  status={kycStatusLabel[profile.kycStatus || ''] || 'Chưa cập nhật'}
                />
                <VerificationItem
                  title="Hợp đồng"
                  description={profile.contractSignedAt ? `Đã ký lúc ${profile.contractSignedAt}` : 'Ký hợp đồng sau khi doctor phê duyệt hồ sơ.'}
                  checked={profile.contractSigned}
                  status={contractStatusLabel[profile.contractStatus || ''] || 'Chưa có'}
                />
              </div>
            </Card>
          </div>

          <Card>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-lav-100 text-lav-dark">
                  <FileBadge size={20} />
                </div>
                <div>
                  <h3 className="font-serif text-[23px] font-black text-text-dark">Chứng chỉ</h3>
                  <p className="text-[13px] font-semibold text-text-light">
                    {profile.certificationCount ?? profile.certifications?.length ?? 0} chứng chỉ đã lưu trong hồ sơ.
                  </p>
                </div>
              </div>
              {profile.canEditProfessionalInfo && (
                <Link to="/nurse/onboarding">
                  <Btn variant="soft" size="sm">Quản lý chứng chỉ</Btn>
                </Link>
              )}
            </div>

            {profile.certifications?.length ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {profile.certifications.map((certification) => (
                  <CertificationCard key={certification.id} certification={certification} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-lav-200 bg-lav-100/40 px-5 py-8 text-center">
                <FileBadge className="mx-auto text-lav-dark" size={30} />
                <p className="mt-3 text-[14px] font-black text-text-dark">Chưa có chứng chỉ</p>
                <p className="mt-1 text-[13px] font-semibold text-text-mid">Bạn có thể bổ sung chứng chỉ trong luồng onboarding.</p>
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
};

export default NurseProfile;
