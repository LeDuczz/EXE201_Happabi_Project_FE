import { AlertCircle, ArrowLeft, CheckCircle2, Lock, MessageSquareText, Phone, Send } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import Btn from '../../components/common/Btn';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import { PASSWORD_POLICY_MESSAGE, getPasswordPolicyError } from '../../utils/passwordPolicy';
import { PHONE_POLICY_MESSAGE, getVietnamPhoneError, normalizeVietnamPhone } from '../../utils/phonePolicy';

const getApiErrorMessage = (err: any) => {
  const data = err.response?.data;
  const validationMessage = data?.errors?.[0]?.message;
  if (validationMessage) return validationMessage;
  if (data?.message) return data.message;
  return 'Không thể xử lý yêu cầu. Vui lòng thử lại.';
};

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const requestOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');

    const phoneError = getVietnamPhoneError(phone);
    if (phoneError) {
      setError(phoneError);
      return;
    }

    setIsLoading(true);

    try {
      const normalizedPhone = normalizeVietnamPhone(phone);
      await axiosClient.post('/api/v1/auth/forgot-password', { phone: normalizedPhone });
      setPhone(normalizedPhone);
      setStep('reset');
      setMessage('Mã OTP đặt lại mật khẩu đã được gửi qua SMS.');
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');

    const passwordError = getPasswordPolicyError(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    const phoneError = getVietnamPhoneError(phone);
    if (phoneError) {
      setError(phoneError);
      return;
    }

    setIsLoading(true);

    try {
      await axiosClient.post('/api/v1/auth/reset-password', {
        phone: normalizeVietnamPhone(phone),
        otpCode,
        newPassword,
      });
      setMessage('Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.');
      setTimeout(() => navigate('/auth/mother', { replace: true }), 900);
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-[#fff9fb] lg:grid-cols-[0.95fr_1.05fr]">
      <div className="flex items-center justify-center p-4">
        <Card className="w-full max-w-[460px] rounded-[28px] p-7 shadow-[0_24px_70px_rgba(168,85,247,.13)]">
          <div className="mb-6 text-center">
            <Link to="/" className="mb-4 inline-flex items-center gap-2">
              <img src="/image/logo.png" alt="Happabi" className="h-12 w-12 rounded-2xl object-cover" />
              <span className="font-serif text-3xl font-black text-grad">Happabi</span>
            </Link>
            <h1 className="text-3xl font-black text-dark-200">Quên mật khẩu</h1>
            <p className="mt-2 text-sm text-text-mid">
              {step === 'request' ? 'Nhập số điện thoại để nhận mã OTP.' : 'Nhập OTP và mật khẩu mới.'}
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-danger-bg p-3 text-sm text-danger">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {message && (
            <div className="mb-5 flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-bold text-green-700">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {step === 'request' ? (
            <form onSubmit={requestOtp}>
              <Input
                label="Số điện thoại"
                placeholder="0912345678"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                icon={<Phone size={18} />}
                hint={PHONE_POLICY_MESSAGE}
                required
              />
              <Btn full type="submit" disabled={isLoading}>
                <Send size={16} /> {isLoading ? 'Đang gửi OTP...' : 'Gửi OTP'}
              </Btn>
            </form>
          ) : (
            <form onSubmit={resetPassword}>
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
                label="Mã OTP"
                placeholder="123456"
                value={otpCode}
                onChange={(event) => setOtpCode(event.target.value)}
                icon={<MessageSquareText size={18} />}
                required
              />
              <Input
                label="Mật khẩu mới"
                type={showPassword ? 'text' : 'password'}
                placeholder="Tối thiểu 8 ký tự"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                icon={<Lock size={18} />}
                hint={PASSWORD_POLICY_MESSAGE}
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
              <Btn full type="submit" disabled={isLoading}>
                <Lock size={16} /> {isLoading ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
              </Btn>
            </form>
          )}

          <button
            type="button"
            className="mt-5 w-full text-center text-sm font-black text-lav-dark"
            onClick={() => navigate('/auth/mother')}
          >
            Quay lại đăng nhập
          </button>
        </Card>
      </div>

      <div className="relative hidden overflow-hidden bg-[#f7f0ff] lg:block">
        <img src="/image/2.webp" alt="Happabi" className="absolute inset-0 h-full w-full object-cover opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#fff0f8]/88 via-white/68 to-[#f7f0ff]/82" />
        <div className="relative z-10 flex h-full flex-col justify-between p-10">
          <button className="flex w-fit items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-black text-text-mid backdrop-blur" onClick={() => navigate('/')}>
            <ArrowLeft size={16} /> Landing
          </button>
          <div className="max-w-xl">
            <h2 className="font-serif text-6xl font-black leading-none text-dark-200">Lấy lại quyền truy cập Happabi.</h2>
            <p className="mt-5 text-lg leading-8 text-text-mid">
              BE sẽ gửi OTP qua SMS để xác nhận trước khi đặt mật khẩu mới.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
