import { AlertCircle, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import Btn from '../../components/common/Btn';
import { useAuth } from '../../contexts/AuthContext';

const processedSocialCodes = new Set<string>();

const codeStorageKey = (code: string) => `happabi_social_code_${code}`;

const SocialCallback = () => {
  const [error, setError] = useState('');
  const [isSlow, setIsSlow] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const syncStarted = useRef(false);

  useEffect(() => {
    if (syncStarted.current) return;
    syncStarted.current = true;

    const slowTimer = window.setTimeout(() => {
      setIsSlow(true);
    }, 8000);

    const sync = async () => {
      const params = new URLSearchParams(location.search);
      const code = params.get('code');
      const redirectUri = `${window.location.origin}/social/callback`;

      if (!code) {
        setError('Không nhận được authorization code từ Cognito.');
        return;
      }

      const storageKey = codeStorageKey(code);
      const codeState = sessionStorage.getItem(storageKey);
      const hasToken = Boolean(localStorage.getItem('happabi_access_token'));

      if (processedSocialCodes.has(code) || codeState === 'processing' || codeState === 'done') {
        if (hasToken) {
          navigate('/', { replace: true });
          return;
        }
      }

      processedSocialCodes.add(code);
      sessionStorage.setItem(storageKey, 'processing');

      try {
        const response = await axiosClient.post('/api/v1/auth/social/sync', { code, redirectUri });
        const payload = response.data?.data;
        if (!payload?.accessToken || !payload?.user) {
          throw new Error('SOCIAL_RESPONSE_INVALID');
        }
        login({ accessToken: payload.accessToken, refreshToken: payload.refreshToken, user: payload.user, activeRole: 'MOTHER' });
        sessionStorage.setItem(storageKey, 'done');
        window.clearTimeout(slowTimer);
        navigate('/', { replace: true });
      } catch (err: any) {
        const message = err.response?.data?.message || '';
        const alreadyLoggedIn = Boolean(localStorage.getItem('happabi_access_token'));

        if (alreadyLoggedIn && (message.includes('invalid_grant') || message.includes('Invalid code'))) {
          sessionStorage.setItem(storageKey, 'done');
          window.clearTimeout(slowTimer);
          navigate('/', { replace: true });
          return;
        }

        sessionStorage.removeItem(storageKey);
        processedSocialCodes.delete(code);

        window.clearTimeout(slowTimer);
        if (err.code === 'ECONNABORTED') {
          setError('Đồng bộ tài khoản social quá lâu. Kiểm tra kết nối BE tới Cognito và thử lại.');
        } else {
          setError(message || 'Đồng bộ tài khoản social không thành công.');
        }
      }
    };

    sync();

    return () => {
      window.clearTimeout(slowTimer);
    };
  }, [location.search, login, navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fff9fb] p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
          <AlertCircle size={44} className="mx-auto mb-4 text-danger" />
          <h1 className="mb-2 text-xl font-black text-dark-200">Đăng nhập social thất bại</h1>
          <p className="mb-6 text-sm text-text-mid">{error}</p>
          <Btn onClick={() => navigate('/auth/mother')}>Quay lại đăng nhập</Btn>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-grad text-white">
      <div className="text-center">
        <Loader2 size={46} className="mx-auto mb-4 animate-spin" />
        <h1 className="text-xl font-black">Đang đồng bộ tài khoản...</h1>
        <p className="mt-2 text-sm opacity-80">Vui lòng chờ trong giây lát.</p>
        {isSlow && (
          <p className="mx-auto mt-4 max-w-md text-sm text-white/75">
            Cognito đang phản hồi chậm. Nếu màn hình này không tự chuyển, hãy quay lại đăng nhập và thử lại.
          </p>
        )}
      </div>
    </div>
  );
};

export default SocialCallback;
