import {
  Camera,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  Mail,
  Phone,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { getMyProfile, uploadMyProfileAvatar } from '../../api/userProfileApi';
import Avatar from '../../components/common/Avatar';
import Btn from '../../components/common/Btn';
import Card from '../../components/common/Card';
import Tag from '../../components/common/Tag';
import Topbar from '../../components/layout/Topbar';
import { useAuth, type UserProfile } from '../../contexts/AuthContext';
import { getApiErrorMessage } from '../../utils/apiError';

const roleLabel: Record<string, string> = {
  ADMIN: 'Admin',
  DOCTOR: 'Doctor',
  NURSE: 'Nurse',
  MOTHER: 'Mother',
};

const providerLabel: Record<string, string> = {
  LOCAL: 'Số điện thoại',
  GOOGLE: 'Google',
  FACEBOOK: 'Facebook',
};

const getInitials = (name?: string) => {
  if (!name) return 'DR';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const formatValue = (value?: string | boolean | null) => {
  if (value === undefined || value === null || value === '') return 'Chưa cập nhật';
  if (typeof value === 'boolean') return value ? 'Đã xác thực' : 'Chưa xác thực';
  return value;
};

const InfoTile = ({
  icon,
  label,
  value,
  tone = 'lav',
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | boolean | null;
  tone?: 'lav' | 'green' | 'pink' | 'slate';
}) => {
  const tones = {
    lav: 'bg-lav-100 text-lav-dark',
    green: 'bg-green-50 text-green-700',
    pink: 'bg-pink-100 text-pink-dark',
    slate: 'bg-slate-100 text-slate-600',
  };

  return (
    <div className="rounded-2xl border border-lav-100 bg-white p-4">
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${tones[tone]}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[12px] font-bold text-text-light">{label}</p>
          <p className="mt-1 break-words text-[14px] font-semibold text-text-dark">{formatValue(value)}</p>
        </div>
      </div>
    </div>
  );
};

const DoctorProfile = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { user, refreshMe } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(user);
  const [isLoading, setIsLoading] = useState(!user);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);
    setError('');

    getMyProfile()
      .then((data) => {
        if (!ignore) setProfile(data);
      })
      .catch((err) => {
        if (!ignore) setError(getApiErrorMessage(err, 'Không tải được hồ sơ doctor.'));
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const uploadAvatar = async (file: File) => {
    setError('');
    setSuccess('');
    setIsUploadingAvatar(true);

    try {
      const avatarUrl = await uploadMyProfileAvatar(file);
      setProfile((current) => current ? { ...current, avatarUrl } : current);
      await refreshMe();
      setSuccess('Ảnh đại diện doctor đã được cập nhật.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không cập nhật được ảnh đại diện.'));
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <Topbar title="Hồ sơ doctor" subtitle="Thông tin tài khoản doctor dùng để duyệt hồ sơ nurse trong Happabi." />

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
          <p className="text-[14px] font-bold text-text-mid">Đang tải hồ sơ doctor...</p>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="overflow-hidden p-0">
            <div className="bg-gradient-to-r from-lav-100 via-white to-pink-100 p-6">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <Avatar initials={getInitials(profile?.fullName)} src={profile?.avatarUrl} size={112} />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-dark-200 text-white shadow-lg disabled:opacity-60"
                      aria-label="Cập nhật avatar doctor"
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

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-heading text-[34px] font-semibold leading-tight text-text-dark">
                        {profile?.fullName || 'Doctor Happabi'}
                      </h2>
                      <Tag variant={profile?.isActive ? 'green' : 'gray'}>
                        {profile?.isActive ? 'Đang hoạt động' : 'Tạm khóa'}
                      </Tag>
                    </div>
                    <p className="mt-1 text-[14px] font-bold text-text-mid">
                      {profile?.email || profile?.phone || 'Chưa có thông tin liên hệ'}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {(profile?.roles || []).map((role) => (
                        <Tag key={role} variant={role === 'DOCTOR' ? 'grad' : 'purple'}>
                          {roleLabel[role] || role}
                        </Tag>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/80 bg-white/85 p-4 lg:w-[280px]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lav-100 text-lav-dark">
                      <Stethoscope size={21} />
                    </div>
                    <div>
                      <p className="text-[12px] font-bold text-text-light">Vai trò hệ thống</p>
                      <p className="mt-1 text-[14px] font-semibold text-text-dark">Duyệt hồ sơ nurse</p>
                    </div>
                  </div>
                  <Btn
                    full
                    size="sm"
                    variant="soft"
                    className="mt-4"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                  >
                    {isUploadingAvatar ? 'Đang tải ảnh...' : 'Cập nhật ảnh đại diện'}
                  </Btn>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
            <Card>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-lav-100 text-lav-dark">
                  <UserRound size={20} />
                </div>
                <div>
                  <h3 className="text-heading text-[24px] font-semibold text-text-dark">Thông tin tài khoản</h3>
                  <p className="text-[13px] font-semibold text-text-light">Thông tin định danh dùng cho đăng nhập doctor portal.</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <InfoTile icon={<Phone size={18} />} label="Số điện thoại" value={profile?.phone} tone={profile?.phoneVerified ? 'green' : 'slate'} />
                <InfoTile icon={<Mail size={18} />} label="Email" value={profile?.email} tone={profile?.emailVerified ? 'green' : 'slate'} />
                <InfoTile icon={<CheckCircle2 size={18} />} label="Xác thực điện thoại" value={profile?.phoneVerified} tone={profile?.phoneVerified ? 'green' : 'slate'} />
                <InfoTile icon={<CheckCircle2 size={18} />} label="Xác thực email" value={profile?.emailVerified} tone={profile?.emailVerified ? 'green' : 'slate'} />
              </div>
            </Card>

            <Card>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-100 text-pink-dark">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-heading text-[24px] font-semibold text-text-dark">Quyền thao tác</h3>
                  <p className="text-[13px] font-semibold text-text-light">Các phần doctor được phép xử lý.</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-lav-100 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <FileSearch size={18} className="text-lav-dark" />
                    <div>
                      <p className="text-[13px] font-semibold text-text-dark">Duyệt hồ sơ nurse</p>
                      <p className="mt-1 text-[12px] font-bold text-text-mid">Xem KYC, chứng chỉ, approve hoặc reject hồ sơ.</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-lav-100 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <ClipboardCheck size={18} className="text-lav-dark" />
                    <div>
                      <p className="text-[13px] font-semibold text-text-dark">Kiểm duyệt chuyên môn</p>
                      <p className="mt-1 text-[12px] font-bold text-text-mid">Thông tin chuyên môn doctor kiểm tra nằm ở màn duyệt nurse.</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-lav-100 bg-white p-4">
                  <p className="text-[12px] font-bold text-text-light">Phương thức đăng nhập</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(profile?.linkedProviders?.length ? profile.linkedProviders : ['LOCAL']).map((provider) => (
                      <Tag key={provider} variant="purple">{providerLabel[provider] || provider}</Tag>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </>
  );
};

export default DoctorProfile;
