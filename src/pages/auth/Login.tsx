import { AlertCircle, ArrowLeft, Lock, Phone, ShieldCheck } from 'lucide-react';
import { useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import Btn from '../../components/common/Btn';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import { useAuth, type UserRole } from '../../contexts/AuthContext';
import { getAppEnv } from '../../config/env';
import { getApiErrorMessage } from '../../utils/apiError';
import { PHONE_POLICY_MESSAGE, getVietnamPhoneError, normalizeVietnamPhone } from '../../utils/phonePolicy';

interface LoginProps {
  portalRole: UserRole;
}

const portalConfig: Record<UserRole, {
  label: string;
  title: string;
  subtitle: string;
  heroTitle: string;
  heroText: string;
  targetPath: string;
}> = {
  MOTHER: {
    label: 'Mother',
    title: 'Đăng nhập Mother',
    subtitle: 'Google, Facebook hoặc số điện thoại và mật khẩu',
    heroTitle: 'Chào mẹ quay lại Happabi.',
    heroText: 'Đăng nhập để đặt lịch chăm sóc mẹ và bé, theo dõi hành trình phục hồi và vào homepage khi sẵn sàng.',
    targetPath: '/',
  },
  NURSE: {
    label: 'Nurse',
    title: 'Đăng nhập Nurse',
    subtitle: 'Nurse đăng nhập bằng số điện thoại và mật khẩu',
    heroTitle: 'Chào nurse của Happabi.',
    heroText: 'Đăng nhập để hoàn tất onboarding, quản lý lịch làm việc, checklist và doanh thu.',
    targetPath: '/nurse/onboarding',
  },
  DOCTOR: {
    label: 'Doctor',
    title: 'Đăng nhập Doctor',
    subtitle: 'Doctor đăng nhập bằng số điện thoại và mật khẩu do admin cấp',
    heroTitle: 'Không gian duyệt hồ sơ chuyên môn.',
    heroText: 'Doctor kiểm tra hồ sơ nurse, đối chiếu KYC, chứng chỉ và đưa ra quyết định duyệt hoặc từ chối.',
    targetPath: '/doctor/nurses/review',
  },
  ADMIN: {
    label: 'Admin',
    title: 'Đăng nhập Admin',
    subtitle: 'Admin đăng nhập để quản trị hệ thống Happabi',
    heroTitle: 'Bảng điều khiển vận hành Happabi.',
    heroText: 'Admin quản lý người dùng, tạo tài khoản doctor, theo dõi audit logs và cấu hình hệ thống.',
    targetPath: '/admin/dashboard',
  },
};

const getSocialUrl = (provider: 'Google' | 'Facebook') => {
  const rawDomain = getAppEnv('VITE_AWS_COGNITO_DOMAIN');
  const clientId = getAppEnv('VITE_AWS_COGNITO_CLIENT_ID');
  const redirectUri = getAppEnv('VITE_COGNITO_REDIRECT_SIGN_IN') ?? `${window.location.origin}/social/callback`;
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

const Login = ({ portalRole }: LoginProps) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const submitInFlight = useRef(false);
  const config = portalConfig[portalRole];
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const tabs = useMemo(
    () => ([
      ['MOTHER', '/auth/mother'],
      ['NURSE', '/auth/nurse'],
      ['DOCTOR', '/auth/doctor'],
      ['ADMIN', '/auth/admin'],
    ] as Array<[UserRole, string]>),
    [],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
      const response = await axiosClient.post('/api/v1/auth/login', {
        phone: normalizeVietnamPhone(phone),
        password,
        portalRole,
      });
      const payload = response.data?.data;
      if (!payload?.accessToken || !payload?.user) {
        throw new Error('LOGIN_RESPONSE_INVALID');
      }

      login({
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
        user: payload.user,
        activeRole: portalRole,
      });
      navigate(config.targetPath, { replace: true });
    } catch (err) {
      if (err instanceof Error && err.message === 'LOGIN_RESPONSE_INVALID') {
        setError('BE đã phản hồi login nhưng thiếu token hoặc thông tin account.');
      } else {
        setError(getApiErrorMessage(err, 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.'));
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
          <button className="flex w-fit items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-semibold text-text-mid backdrop-blur" onClick={() => navigate('/')}>
            <ArrowLeft size={16} /> Landing
          </button>
          <div className="max-w-xl">
            <img src="/image/logo.png" alt="Happabi" className="mb-5 h-16 w-16 rounded-3xl object-cover shadow-lg" />
            <h1 className="text-heading text-4xl font-semibold leading-tight text-dark-200 md:text-5xl">{config.heroTitle}</h1>
            <p className="mt-5 text-body-lg text-text-mid">{config.heroText}</p>
          </div>
          <div className="grid max-w-xl grid-cols-3 gap-3">
            {['Hồ sơ xác thực', 'Phân quyền rõ ràng', 'Theo dõi minh bạch'].map((item) => (
              <div key={item} className="rounded-2xl border border-white/70 bg-white/78 p-4 text-sm font-semibold text-text-mid backdrop-blur">{item}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-4">
        <Card className="w-full max-w-[480px] rounded-[28px] p-7 shadow-[0_24px_70px_rgba(168,85,247,.13)]">
          <div className="mb-6 text-center">
            <Link to="/" className="mb-4 inline-flex items-center gap-2">
              <img src="/image/logo.png" alt="Happabi" className="h-12 w-12 rounded-2xl object-cover" />
              <span className="text-heading text-3xl font-semibold text-grad">Happabi</span>
            </Link>
            <h1 className="text-3xl font-semibold text-dark-200">{config.title}</h1>
            <p className="mt-2 text-sm text-text-mid">{config.subtitle}</p>
          </div>

          <div className="mb-5 grid grid-cols-4 gap-2 rounded-2xl bg-lav-100 p-1">
            {tabs.map(([role, path]) => {
              const active = role === portalRole;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => navigate(path)}
                  className={`rounded-xl px-2 py-2 text-xs font-semibold ${active ? 'bg-white text-lav-dark shadow-sm' : 'text-text-mid'}`}
                >
                  {portalConfig[role].label}
                </button>
              );
            })}
          </div>

          {portalRole === 'MOTHER' && (
            <div className="mb-5 grid gap-3 sm:grid-cols-2">
              <button
                className="flex items-center justify-center gap-2 rounded-xl border border-lav-200 bg-white px-4 py-3 text-sm font-semibold text-text-dark shadow-sm"
                onClick={() => socialLogin('Google')}
                type="button"
              >
                <span className="text-lg">G</span> Google
              </button>
              <button
                className="flex items-center justify-center gap-2 rounded-xl border border-lav-200 bg-white px-4 py-3 text-sm font-semibold text-text-dark shadow-sm"
                onClick={() => socialLogin('Facebook')}
                type="button"
              >
                <span className="text-lg font-semibold text-[#1877f2]">f</span> Facebook
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
              <Link to="/forgot-password" className="text-sm font-semibold text-lav-dark hover:underline">
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

          {(portalRole === 'MOTHER' || portalRole === 'NURSE') && (
            <p className="mt-6 text-center text-sm font-semibold text-text-mid">
              Chưa có tài khoản?{' '}
              <Link to={portalRole === 'MOTHER' ? '/register/mother' : '/register/nurse'} className="font-semibold text-lav-dark hover:underline">
                Đăng ký ngay
              </Link>
            </p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Login;
