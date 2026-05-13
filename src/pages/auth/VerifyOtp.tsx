import { AlertCircle, MessageSquareText } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import Btn from '../../components/common/Btn';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import type { UserRole } from '../../contexts/AuthContext';

interface VerifyState {
  phone?: string;
  role?: Extract<UserRole, 'MOTHER' | 'NURSE'>;
}

const normalizeVietnamPhone = (value: string) => {
  const compact = value.replace(/\s+/g, '');
  if (compact.startsWith('0')) return `+84${compact.slice(1)}`;
  if (compact.startsWith('84')) return `+${compact}`;
  return compact;
};

const getApiErrorMessage = (err: any, fallback: string) => {
  const data = err.response?.data;
  const validationMessage = data?.errors?.[0]?.message;
  if (validationMessage) return validationMessage;
  if (data?.message) return data.message;
  if (err.response?.status === 0 || err.code === 'ERR_NETWORK') {
    return 'Không kết nối được BE. Kiểm tra backend đang chạy và VITE_API_BASE_URL.';
  }
  return fallback;
};

const VerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as VerifyState;
  const [phone, setPhone] = useState(state.phone ?? '');
  const [otpCode, setOtpCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const role = state.role ?? 'MOTHER';

  const verify = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const normalizedPhone = normalizeVietnamPhone(phone);
      await axiosClient.post('/api/v1/auth/verify-otp', { phone: normalizedPhone, otpCode });
      navigate(role === 'NURSE' ? '/auth/nurse' : '/auth/mother', { replace: true });
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'OTP không hợp lệ hoặc đã hết hạn.'));
    } finally {
      setIsLoading(false);
    }
  };

  const resend = async () => {
    setError('');
    setMessage('');
    try {
      await axiosClient.post('/api/v1/auth/resend-otp', { phone: normalizeVietnamPhone(phone) });
      setMessage('Đã gửi lại mã OTP.');
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Không thể gửi lại OTP.'));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fff9fb] p-4">
      <Card className="w-full max-w-[440px] rounded-2xl p-7">
        <div className="mb-6 text-center">
          <Link to="/" className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-grad text-xl font-black text-white">
            H
          </Link>
          <h1 className="text-3xl font-black text-dark-200">Xác thực OTP</h1>
          <p className="mt-2 text-sm text-text-mid">Nhập mã OTP được gửi đến số điện thoại của bạn.</p>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-danger-bg p-3 text-sm text-danger">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {message && <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-700">{message}</div>}

        <form onSubmit={verify}>
          <Input label="Số điện thoại" placeholder="+84901234567" value={phone} onChange={(event) => setPhone(event.target.value)} required />
          <Input
            label="Mã OTP"
            placeholder="123456"
            value={otpCode}
            onChange={(event) => setOtpCode(event.target.value)}
            icon={<MessageSquareText size={18} />}
            required
          />
          <Btn full type="submit" disabled={isLoading} className="mt-2">
            {isLoading ? 'Đang xác thực...' : 'Xác thực'}
          </Btn>
        </form>

        <button className="mt-5 w-full text-center text-sm font-black text-lav-dark" onClick={resend} type="button">
          Gửi lại OTP
        </button>
      </Card>
    </div>
  );
};

export default VerifyOtp;
