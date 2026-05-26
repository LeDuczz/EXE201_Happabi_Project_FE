import { AlertCircle, ArrowLeft, Lock, Phone, ShieldCheck } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import Btn from '../../components/common/Btn';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import { useAuth, type UserRole } from '../../contexts/AuthContext';
import { PHONE_POLICY_MESSAGE, getVietnamPhoneError, normalizeVietnamPhone } from '../../utils/phonePolicy';

interface LoginProps {
  portalRole: UserRole;
}

const getSocialUrl = (provider: 'Google' | 'Facebook') => {
  const rawDomain = import.meta.env.VITE_AWS_COGNITO_DOMAIN;
  const clientId = import.meta.env.VITE_AWS_COGNITO_CLIENT_ID;
  const redirectUri = `${window.location.origin}/social/callback`;
  if (!rawDomain || !clientId) return '';

  const domain = /^https?:\/\//i.test(rawDomain)
    ? rawDomain
    : `https://${rawDomain}`;

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    scope: 'openid email profile aws.cognito.signin.user.admin',
    redirect_uri: redirectUri,
    identity_provider: provider,
    state: `${provider.toUpperCase()}:${crypto.randomUUID()}`,
  });

  return `${domain.replace(/\/$/, '')}/oauth2/authorize?${params.toString()}`;
};

const getApiErrorMessage = (err: any) => {
  const data = err.response?.data;
  const validationMessage = data?.errors?.[0]?.message;
  if (validationMessage) return validationMessage;
  if (data?.message) return data.message;
  if (err.response?.status === 0 || err.code === 'ERR_NETWORK') {
    return 'Không kết nối được BE. Kiểm tra backend đang chạy và VITE_API_BASE_URL.';
  }
  return 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.';
};

const Login = ({ portalRole }: LoginProps) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const submitInFlight = useRef(false);

  const isMother = portalRole === 'MOTHER';
  const isAdmin = portalRole === 'ADMIN';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitInFlight.current) return;

    const phoneError = getVietnamPhoneError(phone);
    if (phoneError) {
      setError(phoneError);
      return;
    }

    submitInFlight.current = true;
    setError('');
    setIsLoading(true);

    try {
      const normalizedPhone = normalizeVietnamPhone(phone);
      const response = await axiosClient.post('/api/v1/auth/login', {
        phone: normalizedPhone,
        password,
        portalRole,
      });
      const payload = response.data?.data;
      if (!payload?.accessToken || !payload?.user) {
        throw new Error('LOGIN_RESPONSE_INVALID');
      }
      login({ accessToken: payload.accessToken, refreshToken: payload.refreshToken, user: payload.user, activeRole: portalRole });

      let targetPath = '/';
      if (portalRole === 'NURSE') targetPath = '/nurse/onboarding';
      else if (portalRole === 'ADMIN') targetPath = '/admin/dashboard';

      navigate(targetPath, { replace: true });
    } catch (err: any) {
      if (err.message === 'LOGIN_RESPONSE_INVALID') {
        setError('BE đã phản hồi login nhưng thiếu token hoặc thông tin account.');
      } else {
        setError(getApiErrorMessage(err));
      }
    } finally {
      submitInFlight.current = false;
      setIsLoading(false);
    }
  };

  const socialLogin = (provider: 'Google' | 'Facebook') => {
    const url = getSocialUrl(provider);
    if (!url) {
      setError('Thiếu cấu hình Cognito social login trong file .env frontend.');
      return;
    }
    window.location.assign(url);
  };

  return (
    <div className="grid min-h-screen bg-[#fff9fb] lg:grid-cols-[1.05fr_0.95fr]">
      <div className="relative hidden overflow-hidden bg-[#f7f0ff] lg:block">
        <img src="/image/1.webp" alt="Happabi" className="absolute inset-0 h-full w-full object-cover opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/72 via-[#f7f0ff]/60 to-[#fff0f8]/82" />
        <div className="relative z-10 flex h-full flex-col justify-between p-10">
          <button className="flex w-fit items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-black text-text-mid backdrop-blur" onClick={() => navigate('/')}>
            <ArrowLeft size={16} /> Landing
          </button>
          <div className="max-w-xl">
            <img src="/image/logo.png" alt="Happabi" className="mb-5 h-16 w-16 rounded-3xl object-cover shadow-lg" />
            <h1 className="font-serif text-6xl font-black leading-none text-dark-200">
              {isMother ? 'Chào mẹ quay lại Happabi.' : 'Chào nurse của Happabi.'}
            </h1>
            <p className="mt-5 text-lg leading-8 text-text-mid">
              {isMother
                ? 'Đăng nhập để đặt lịch chăm sóc mẹ và bé, theo dõi hành trình phục hồi và vào homepage khi sẵn sàng.'
                : 'Đăng nhập bằng số điện thoại và mật khẩu để vào thẳng homepage quản lý lịch làm.'}
            </p>
          </div>
          <div className="grid max-w-xl grid-cols-3 gap-3">
            {['Hồ sơ xác thực', 'Đặt lịch nhanh', 'Theo dõi rõ ràng'].map((item) => (
              <div key={item} className="rounded-2xl border border-white/70 bg-white/78 p-4 text-sm font-black text-text-mid backdrop-blur">{item}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-4">
        <Card className="w-full max-w-[460px] rounded-[28px] p-7 shadow-[0_24px_70px_rgba(168,85,247,.13)]">
          <div className="mb-6 text-center">
            <Link to="/" className="mb-4 inline-flex items-center gap-2">
              <img src="/image/logo.png" alt="Happabi" className="h-12 w-12 rounded-2xl object-cover" />
              <span className="font-serif text-3xl font-black text-grad">Happabi</span>
            </Link>
            <h1 className="text-3xl font-black text-dark-200">
              {isAdmin ? 'Quản trị hệ thống' : isMother ? 'Đăng nhập Mother' : 'Đăng nhập Nurse'}
            </h1>
            <p className="mt-2 text-sm text-text-mid">
              {isAdmin
                ? 'Sử dụng tài khoản quản trị để truy cập hệ thống'
                : isMother ? 'Google, Facebook hoặc số điện thoại và mật khẩu' : 'Nurse đăng nhập bằng số điện thoại và mật khẩu'}
            </p>
          </div>

          <div className="mb-5 grid grid-cols-3 gap-2 rounded-2xl bg-lav-100 p-1">
            <button type="button" onClick={() => navigate('/auth/mother')} className={`rounded-xl px-3 py-2 text-xs font-black ${isMother ? 'bg-white text-pink-dark shadow-sm' : 'text-text-mid'}`}>Mother</button>
            <button type="button" onClick={() => navigate('/auth/nurse')} className={`rounded-xl px-3 py-2 text-xs font-black ${portalRole === 'NURSE' ? 'bg-white text-lav-dark shadow-sm' : 'text-text-mid'}`}>Nurse</button>
            <button type="button" onClick={() => navigate('/auth/admin')} className={`rounded-xl px-3 py-2 text-xs font-black ${isAdmin ? 'bg-white text-dark-200 shadow-sm' : 'text-text-mid'}`}>Admin</button>
          </div>

          {isMother && (
            <div className="mb-5 grid gap-3 sm:grid-cols-2">
              <button
                className="flex items-center justify-center gap-2 rounded-xl border border-lav-200 bg-white px-4 py-3 text-sm font-black text-text-dark shadow-sm"
                onClick={() => socialLogin('Google')}
                type="button"
              >
                <span className="text-lg">G</span> Google
              </button>
              <button
                className="flex items-center justify-center gap-2 rounded-xl border border-lav-200 bg-white px-4 py-3 text-sm font-black text-text-dark shadow-sm"
                onClick={() => socialLogin('Facebook')}
                type="button"
              >
                <span className="text-lg font-black text-[#1877f2]">f</span> Facebook
              </button>
            </div>
          )}

          {error && (
            <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-danger-bg p-3 text-sm text-danger">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Input
              label="Số điện thoại"
              placeholder="0912345678"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              icon={<Phone size={18} />}
              hint={PHONE_POLICY_MESSAGE}
              required
            />
            <Input
              label="Mật khẩu"
              type={showPassword ? 'text' : 'password'}
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              icon={<Lock size={18} />}
              required
            />
            <label className="mb-4 flex w-fit cursor-pointer items-center gap-2 text-sm font-bold text-text-mid">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(event) => setShowPassword(event.target.checked)}
                className="h-4 w-4 accent-lav-dark"
              />
              Hiển thị mật khẩu
            </label>
            <div className="-mt-2 mb-4 text-right">
              <Link to="/forgot-password" className="text-sm font-black text-lav-dark hover:underline">
                Quên mật khẩu?
              </Link>
            </div>
            <Btn full type="submit" disabled={isLoading} className="mt-2">
              {isLoading ? 'Đang đăng nhập...' : (
                <>
                  <ShieldCheck size={17} /> Đăng nhập
                </>
              )}
            </Btn>
          </form>

          <p className="mt-6 text-center text-sm font-semibold text-text-mid">
            Chưa có tài khoản?{' '}
            <Link to={isMother ? '/register/mother' : '/register/nurse'} className="font-black text-lav-dark hover:underline">
              Đăng ký ngay
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Login;
