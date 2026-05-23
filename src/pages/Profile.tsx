import { AlertCircle, Camera, CheckCircle2, KeyRound, Save, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import axiosClient from '../api/axiosClient';
import Btn from '../components/common/Btn';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Topbar from '../components/layout/Topbar';
import { useAuth } from '../contexts/AuthContext';
import { PASSWORD_POLICY_MESSAGE, getPasswordPolicyError } from '../utils/passwordPolicy';
import { PHONE_POLICY_MESSAGE, getVietnamPhoneError, normalizeVietnamPhone } from '../utils/phonePolicy';

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
  return 'Không thể xử lý yêu cầu. Vui lòng thử lại.';
};

const Profile = () => {
  const { primaryRole, user, refreshMe } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [profile, setProfile] = useState<MotherProfile>(emptyProfile);
  const [isLoading, setIsLoading] = useState(primaryRole === 'MOTHER');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [emailDraft, setEmailDraft] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [phoneDraft, setPhoneDraft] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [localPassword, setLocalPassword] = useState('');
  const [showLocalPassword, setShowLocalPassword] = useState(false);

  const hasLocalPassword = Boolean(user?.linkedProviders?.includes('LOCAL'));
  const emailVerified = Boolean(user?.emailVerified);
  const phoneVerified = Boolean(user?.phoneVerified);

  useEffect(() => {
    if (primaryRole !== 'MOTHER') return;

    let ignore = false;
    setIsLoading(true);
    axiosClient.get('/api/v1/users/me/mother-profile')
      .then((response) => {
        if (ignore) return;
        const data = { ...emptyProfile, ...response.data?.data };
        setProfile(data);
        setEmailDraft(data.email || '');
        setPhoneDraft(data.phone || '');
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

  useEffect(() => {
    if (user?.emailVerified && user.email) setEmailDraft(user.email);
    if (user?.phoneVerified && user.phone) setPhoneDraft(user.phone);
  }, [user?.email, user?.emailVerified, user?.phone, user?.phoneVerified]);

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
      await refreshMe();
      setSuccess('Ảnh đại diện đã được cập nhật.');
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      const response = await axiosClient.patch('/api/v1/users/me/mother-profile', {
        fullName: profile.fullName || null,
        babyBirthDate: profile.babyBirthDate || null,
        dayOfBirth: profile.dayOfBirth || null,
        address: profile.address || null,
        city: profile.city || null,
      });
      setProfile({ ...emptyProfile, ...response.data?.data });
      await refreshMe();
      setSuccess('Hồ sơ đã được cập nhật.');
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const requestEmailChange = async () => {
    if (emailVerified) return;
    setError('');
    setSuccess('');
    try {
      const email = emailDraft.trim().toLowerCase();
      await axiosClient.post('/api/v1/users/me/email/change', { email });
      setEmailDraft(email);
      setSuccess('Mã xác thực đã được gửi tới email.');
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    }
  };

  const confirmEmailChange = async () => {
    if (emailVerified) return;
    setError('');
    setSuccess('');
    try {
      await axiosClient.post('/api/v1/users/me/email/confirm', { code: emailCode });
      await refreshMe();
      setEmailCode('');
      setSuccess('Email đã được xác thực.');
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    }
  };

  const requestPhoneChange = async () => {
    if (phoneVerified) return;
    setError('');
    setSuccess('');

    const phoneError = getVietnamPhoneError(phoneDraft);
    if (phoneError) {
      setError(phoneError);
      return;
    }

    try {
      const phone = normalizeVietnamPhone(phoneDraft);
      await axiosClient.post('/api/v1/users/me/phone/change', { phone });
      setPhoneDraft(phone);
      setSuccess('Mã xác thực đã được gửi tới số điện thoại.');
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    }
  };

  const confirmPhoneChange = async () => {
    if (phoneVerified) return;
    setError('');
    setSuccess('');
    try {
      await axiosClient.post('/api/v1/users/me/phone/confirm', { code: phoneCode });
      await refreshMe();
      setPhoneCode('');
      setSuccess('Số điện thoại đã được xác thực.');
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    }
  };

  const createLocalPassword = async () => {
    setError('');
    setSuccess('');

    const passwordError = getPasswordPolicyError(localPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    try {
      await axiosClient.post('/api/v1/auth/local-password', { password: localPassword });
      await refreshMe();
      setLocalPassword('');
      setSuccess('Mật khẩu đăng nhập bằng số điện thoại đã được tạo.');
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    }
  };

  if (primaryRole !== 'MOTHER') {
    return (
      <>
        <Topbar title="Hồ sơ nurse" subtitle="Trang hồ sơ nurse đang phát triển." />
        <Card>
          <p className="text-sm font-bold text-text-mid">API hồ sơ nurse sẽ được nối khi backend hoàn thiện phần cập nhật.</p>
        </Card>
      </>
    );
  }

  return (
    <>
      <Topbar title="Hồ sơ của mẹ" subtitle="Cập nhật hồ sơ, xác thực email/số điện thoại và ảnh đại diện." />

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
          <p className="mt-1 text-sm font-bold text-text-light">{user?.email || user?.phone || 'Chưa có thông tin liên hệ'}</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingAvatar}
            className="mt-5 w-full rounded-xl border border-lav-200 bg-lav-100 px-4 py-3 text-sm font-black text-lav-dark transition hover:bg-lav-200 disabled:opacity-60"
          >
            {isUploadingAvatar ? 'Đang tải ảnh...' : 'Cập nhật ảnh đại diện'}
          </button>

          {!hasLocalPassword && phoneVerified && (
            <div className="mt-5 rounded-2xl border border-lav-200 bg-[#fff9fb] p-4 text-left">
              <div className="mb-3 text-sm font-black text-text-dark">Tạo mật khẩu local</div>
              <Input
                label="Mật khẩu"
                type={showLocalPassword ? 'text' : 'password'}
                value={localPassword}
                onChange={(event) => setLocalPassword(event.target.value)}
                placeholder="Tối thiểu 8 ký tự"
                hint={PASSWORD_POLICY_MESSAGE}
              />
              <label className="mb-3 flex cursor-pointer items-center gap-2 text-xs font-bold text-text-mid">
                <input type="checkbox" checked={showLocalPassword} onChange={(event) => setShowLocalPassword(event.target.checked)} className="h-4 w-4 accent-lav-dark" />
                Hiển thị mật khẩu
              </label>
              <Btn full size="sm" type="button" onClick={createLocalPassword}>
                <KeyRound size={15} /> Tạo mật khẩu
              </Btn>
            </div>
          )}
        </Card>

        <div className="space-y-5">
          <Card className="p-7">
            {isLoading ? (
              <div className="py-12 text-center text-sm font-bold text-text-light">Đang tải hồ sơ...</div>
            ) : (
              <form onSubmit={saveProfile}>
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
                  <p className="mt-1 text-sm font-semibold text-text-light">Phone/email đổi bằng luồng xác thực riêng ở phía dưới.</p>
                </div>

                <div className="grid gap-x-5 md:grid-cols-2">
                  <Input label="Họ và tên" value={profile.fullName ?? ''} onChange={(event) => updateField('fullName', event.target.value)} />
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

          <Card className="p-7">
            <h3 className="mb-4 font-serif text-2xl font-black text-text-dark">Xác thực liên hệ</h3>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-lav-100 bg-[#fff9fb] p-4">
                <div className="mb-2 text-sm font-black text-text-dark">Email</div>
                <Input value={emailDraft} onChange={(event) => setEmailDraft(event.target.value)} placeholder="me@example.com" disabled={emailVerified} />
                {emailVerified ? (
                  <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm font-bold text-green-700">
                    <CheckCircle2 size={16} /> Email đã được xác thực.
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <Btn type="button" size="sm" onClick={requestEmailChange}>
                        <Send size={15} /> Gửi mã
                      </Btn>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Input label="Mã xác thực" value={emailCode} onChange={(event) => setEmailCode(event.target.value)} />
                      <Btn type="button" size="sm" className="mt-[25px] h-[45px]" onClick={confirmEmailChange}>
                        Xác nhận
                      </Btn>
                    </div>
                  </>
                )}
              </div>

              <div className="rounded-2xl border border-lav-100 bg-[#fff9fb] p-4">
                <div className="mb-2 text-sm font-black text-text-dark">Số điện thoại</div>
                <Input value={phoneDraft} onChange={(event) => setPhoneDraft(event.target.value)} placeholder="0912345678" hint={phoneVerified ? undefined : PHONE_POLICY_MESSAGE} disabled={phoneVerified} />
                {phoneVerified ? (
                  <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm font-bold text-green-700">
                    <CheckCircle2 size={16} /> Số điện thoại đã được xác thực.
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <Btn type="button" size="sm" onClick={requestPhoneChange}>
                        <Send size={15} /> Gửi mã
                      </Btn>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Input label="Mã xác thực" value={phoneCode} onChange={(event) => setPhoneCode(event.target.value)} />
                      <Btn type="button" size="sm" className="mt-[25px] h-[45px]" onClick={confirmPhoneChange}>
                        Xác nhận
                      </Btn>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Profile;
