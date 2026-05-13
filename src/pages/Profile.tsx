import { AlertCircle, Camera, CheckCircle2, Save } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import axiosClient from '../api/axiosClient';
import Btn from '../components/common/Btn';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Topbar from '../components/layout/Topbar';
import { useAuth } from '../contexts/AuthContext';

interface MotherProfile {
  id: string;
  fullName?: string;
  phone?: string;
  email?: string;
  babyBirthDate?: string;
  dayOfBirth?: string;
  address?: string;
  city?: string;
  avatarUrl?: string;
}

const emptyProfile: MotherProfile = {
  id: '',
  fullName: '',
  phone: '',
  email: '',
  babyBirthDate: '',
  dayOfBirth: '',
  address: '',
  city: '',
  avatarUrl: '',
};

const getApiErrorMessage = (err: any) => {
  const data = err.response?.data;
  const validationMessage = data?.errors?.[0]?.message;
  if (validationMessage) return validationMessage;
  if (data?.message) return data.message;
  return 'Không thể cập nhật hồ sơ. Vui lòng thử lại.';
};

const Profile = () => {
  const { primaryRole, refreshMe } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [profile, setProfile] = useState<MotherProfile>(emptyProfile);
  const [initialProfile, setInitialProfile] = useState<MotherProfile>(emptyProfile);
  const [isLoading, setIsLoading] = useState(primaryRole === 'MOTHER');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (primaryRole !== 'MOTHER') return;

    let ignore = false;
    setIsLoading(true);
    axiosClient.get('/api/v1/users/me/mother-profile')
      .then((response) => {
        if (ignore) return;
        const data = { ...emptyProfile, ...response.data?.data };
        setProfile(data);
        setInitialProfile(data);
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
  }, [primaryRole]);

  const updateField = (field: keyof MotherProfile, value: string) => {
    setProfile((current) => ({ ...current, [field]: value }));
  };

  const uploadAvatar = async (file: File) => {
    setError('');
    setSuccess('');
    setIsUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await axiosClient.post('/api/v1/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const avatarUrl = response.data?.data;
      setProfile((current) => ({ ...current, avatarUrl }));
      setInitialProfile((current) => ({ ...current, avatarUrl }));
      await refreshMe();
      setSuccess('Ảnh đại diện đã được cập nhật.');
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      const payload = {
        fullName: profile.fullName || null,
        phone: profile.phone || null,
        email: profile.email || null,
        babyBirthDate: profile.babyBirthDate || null,
        dayOfBirth: profile.dayOfBirth || null,
        address: profile.address || null,
        city: profile.city || null,
      };
      const response = await axiosClient.patch('/api/v1/users/me/mother-profile', payload);
      const data = { ...emptyProfile, ...response.data?.data };
      setProfile(data);
      setInitialProfile(data);
      await refreshMe();
      setSuccess('Hồ sơ đã được cập nhật.');
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  if (primaryRole !== 'MOTHER') {
    return (
      <>
        <Topbar title="Hồ sơ nurse" subtitle="Trang hồ sơ nurse đang phát triển." />
        <Card>
          <p className="text-sm font-bold text-text-mid">
            API hiện tại mới có hồ sơ mother get/update. Hồ sơ nurse sẽ nối sau khi BE sẵn sàng.
          </p>
        </Card>
      </>
    );
  }

  return (
    <>
      <Topbar title="Hồ sơ của mẹ" subtitle="Cập nhật thông tin cá nhân và ảnh đại diện." />

      <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
        <Card className="h-fit text-center">
          <div className="relative mx-auto mb-5 h-28 w-28">
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-grad text-3xl font-black text-white shadow-[0_12px_32px_rgba(168,85,247,.25)]">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.fullName || 'Avatar'} className="h-full w-full object-cover" />
              ) : (
                profile.fullName?.slice(0, 2).toUpperCase() || 'HB'
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-dark-200 text-white shadow-lg disabled:opacity-60"
              aria-label="Cập nhật avatar"
            >
              <Camera size={17} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadAvatar(file);
              }}
            />
          </div>

          <h2 className="font-serif text-2xl font-black text-text-dark">{profile.fullName || 'Mẹ Happabi'}</h2>
          <p className="mt-1 text-sm font-bold text-text-light">{profile.email || profile.phone || 'Chưa có thông tin liên hệ'}</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingAvatar}
            className="mt-5 w-full rounded-xl border border-lav-200 bg-lav-100 px-4 py-3 text-sm font-black text-lav-dark transition hover:bg-lav-200 disabled:opacity-60"
          >
            {isUploadingAvatar ? 'Đang tải ảnh...' : 'Cập nhật ảnh đại diện'}
          </button>
        </Card>

        <Card className="p-7">
          {isLoading ? (
            <div className="py-12 text-center text-sm font-bold text-text-light">Đang tải hồ sơ...</div>
          ) : (
            <form onSubmit={save}>
              {error && (
                <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-danger-bg p-3 text-sm text-danger">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="mb-5 flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-bold text-green-700">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              <div className="mb-5 border-b border-lav-100 pb-4">
                <h3 className="font-serif text-2xl font-black text-text-dark">Thông tin mẹ bỉm</h3>
              </div>

              <div className="grid gap-x-5 md:grid-cols-2">
                <Input label="Họ và tên" value={profile.fullName ?? ''} onChange={(event) => updateField('fullName', event.target.value)} />
                <Input label="Số điện thoại" value={profile.phone ?? ''} onChange={(event) => updateField('phone', event.target.value)} disabled={Boolean(initialProfile.phone)} />
                <Input label="Email" type="email" value={profile.email ?? ''} onChange={(event) => updateField('email', event.target.value)} disabled={Boolean(initialProfile.email)} />
                <Input label="Ngày sinh của bé" type="date" value={profile.babyBirthDate ?? ''} onChange={(event) => updateField('babyBirthDate', event.target.value)} />
                <Input label="Ngày sinh của mẹ" type="date" value={profile.dayOfBirth ?? ''} onChange={(event) => updateField('dayOfBirth', event.target.value)} />
                <Input label="Thành phố" value={profile.city ?? ''} onChange={(event) => updateField('city', event.target.value)} />
              </div>

              <Input label="Địa chỉ" value={profile.address ?? ''} onChange={(event) => updateField('address', event.target.value)} />

              <div className="mt-5 flex justify-end">
                <Btn type="submit" disabled={isSaving}>
                  <Save size={16} /> {isSaving ? 'Đang lưu...' : 'Lưu hồ sơ'}
                </Btn>
              </div>
            </form>
          )}
        </Card>
      </div>
    </>
  );
};

export default Profile;
