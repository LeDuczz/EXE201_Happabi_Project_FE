import { AlertCircle, ArrowLeft, Lock, Phone, Send, User } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import Btn from '../../components/common/Btn';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import type { UserRole } from '../../contexts/AuthContext';

interface RegisterProps {
  role: Extract<UserRole, 'MOTHER' | 'NURSE'>;
}

const normalizeVietnamPhone = (value: string) => {
  const compact = value.replace(/\s+/g, '');
  if (compact.startsWith('0')) return `+84${compact.slice(1)}`;
  if (compact.startsWith('84')) return `+${compact}`;
  return compact;
};

const getApiErrorMessage = (err: any) => {
  const data = err.response?.data;
  const validationMessage = data?.errors?.[0]?.message;
  if (validationMessage) return validationMessage;
  if (data?.message) return data.message;
  if (err.response?.status === 0 || err.code === 'ERR_NETWORK') {
    return 'Không kết nối được BE. Kiểm tra backend đang chạy và VITE_API_BASE_URL.';
  }
  return 'Đăng ký không thành công. Vui lòng thử lại.';
};

const Register = ({ role }: RegisterProps) => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isMother = role === 'MOTHER';

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const normalizedPhone = normalizeVietnamPhone(phone);
      await axiosClient.post('/api/v1/auth/register', {
        phone: normalizedPhone,
        password,
        fullName,
        role,
      });
      navigate('/verify-otp', { state: { phone: normalizedPhone, role } });
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
          <h1 className="text-3xl font-black text-dark-200">
            {isMother ? 'Đăng ký Mother' : 'Đăng ký Nurse'}
          </h1>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-lav-100 p-1">
          <button type="button" onClick={() => navigate('/register/mother')} className={`rounded-xl px-3 py-2 text-sm font-black ${isMother ? 'bg-white text-pink-dark shadow-sm' : 'text-text-mid'}`}>Mother</button>
          <button type="button" onClick={() => navigate('/register/nurse')} className={`rounded-xl px-3 py-2 text-sm font-black ${!isMother ? 'bg-white text-lav-dark shadow-sm' : 'text-text-mid'}`}>Nurse</button>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-danger-bg p-3 text-sm text-danger">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister}>
          <Input
            label="Họ và tên"
            placeholder="Nguyen Van A"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            icon={<User size={18} />}
            required
          />
          <Input
            label="Số điện thoại"
            placeholder="+84901234567"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            icon={<Phone size={18} />}
            required
          />
          <Input
            label="Mật khẩu"
            type={showPassword ? 'text' : 'password'}
            placeholder="Tối thiểu 8 ký tự"
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
          <Btn full type="submit" disabled={isLoading} className="mt-2">
            {isLoading ? 'Đang gửi OTP...' : (
              <>
                <Send size={16} /> Đăng ký
              </>
            )}
          </Btn>
        </form>

        <p className="mt-6 text-center text-sm font-semibold text-text-mid">
          Đã có tài khoản?{' '}
          <Link to={isMother ? '/auth/mother' : '/auth/nurse'} className="font-black text-lav-dark hover:underline">
            Đăng nhập
          </Link>
        </p>
      </Card>
      </div>

      <div className="relative hidden overflow-hidden bg-[#f7f0ff] lg:block">
        <img src="/image/5.webp" alt="Happabi" className="absolute inset-0 h-full w-full object-cover opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#fff0f8]/88 via-white/62 to-[#f7f0ff]/78" />
        <div className="relative z-10 flex h-full flex-col justify-between p-10">
          <button className="flex w-fit items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-black text-text-mid backdrop-blur" onClick={() => navigate('/')}>
            <ArrowLeft size={16} /> Landing
          </button>
          <div className="max-w-xl">
            <h2 className="font-serif text-6xl font-black leading-none text-dark-200">
              {isMother ? 'Tạo tài khoản cho mẹ.' : 'Bắt đầu hồ sơ nurse.'}
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
