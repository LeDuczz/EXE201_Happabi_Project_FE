import { AlertCircle, CheckCircle2, Clipboard, Loader2, Mail, Phone, ShieldPlus, UserPlus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { adminDoctorApi } from '../../api/adminDoctorApi';
import Btn from '../../components/common/Btn';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Topbar from '../../components/layout/Topbar';
import type { DoctorAccount } from '../../types/adminDoctor';
import { getApiErrorMessage } from '../../utils/apiError';
import { PHONE_POLICY_MESSAGE, getVietnamPhoneError, normalizeVietnamPhone } from '../../utils/phonePolicy';

interface DoctorFormState {
  fullName: string;
  phone: string;
  email: string;
}

const initialForm: DoctorFormState = {
  fullName: '',
  phone: '',
  email: '',
};

const AdminDoctorAccounts = () => {
  const [form, setForm] = useState<DoctorFormState>(initialForm);
  const [createdDoctor, setCreatedDoctor] = useState<DoctorAccount | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: keyof DoctorFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
    setSuccess('');
  };

  const copyPassword = async () => {
    if (!createdDoctor?.initialPassword) return;
    await navigator.clipboard.writeText(createdDoctor.initialPassword);
    setSuccess('Đã sao chép mật khẩu khởi tạo.');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const fullName = form.fullName.trim();
    const email = form.email.trim().toLowerCase();
    const phoneError = getVietnamPhoneError(form.phone);

    if (!fullName) {
      setError('Vui lòng nhập họ tên doctor.');
      return;
    }

    if (phoneError) {
      setError(phoneError);
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const doctor = await adminDoctorApi.createDoctorAccount({
        fullName,
        phone: normalizeVietnamPhone(form.phone),
        email: email || undefined,
      });

      setCreatedDoctor(doctor);
      setForm(initialForm);
      setSuccess('Tạo tài khoản doctor thành công. Vui lòng lưu mật khẩu khởi tạo trước khi rời trang.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không tạo được tài khoản doctor. Vui lòng thử lại.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Topbar
        title="Tạo tài khoản doctor"
        subtitle="Admin tạo tài khoản doctor để duyệt hồ sơ nurse và xử lý nghiệp vụ chuyên môn."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lav-100 text-lav-dark">
              <UserPlus size={22} />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-black text-text-dark">Thông tin doctor</h2>
              <p className="mt-1 text-sm font-semibold text-text-light">Số điện thoại sẽ dùng để đăng nhập portal doctor.</p>
            </div>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2 rounded-2xl border border-red-200 bg-danger-bg p-4 text-sm font-bold text-danger">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 flex items-start gap-2 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="max-w-2xl">
            <Input
              label="Họ tên doctor"
              placeholder="VD: Bác sĩ Nguyễn Minh An"
              value={form.fullName}
              onChange={(event) => updateField('fullName', event.target.value)}
              icon={<ShieldPlus size={18} />}
              maxLength={100}
              required
            />

            <Input
              label="Số điện thoại"
              placeholder="0912345678"
              value={form.phone}
              onChange={(event) => updateField('phone', event.target.value)}
              icon={<Phone size={18} />}
              hint={PHONE_POLICY_MESSAGE}
              required
            />

            <Input
              label="Email"
              placeholder="doctor@example.com"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              icon={<Mail size={18} />}
              type="email"
              maxLength={150}
            />

            <div className="mt-2 flex items-center gap-3">
              <Btn type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 size={17} className="animate-spin" /> : <UserPlus size={17} />}
                Tạo doctor
              </Btn>
              <Btn type="button" variant="ghost" onClick={() => setForm(initialForm)} disabled={isSubmitting}>
                Xóa form
              </Btn>
            </div>
          </form>
        </Card>

        <Card className="p-6">
          <div className="mb-4 font-serif text-xl font-black text-text-dark">Tài khoản vừa tạo</div>
          {createdDoctor ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-lav-100 bg-[#fff9fb] p-4">
                <div className="text-xs font-black uppercase tracking-[1.5px] text-text-light">Doctor</div>
                <div className="mt-1 font-black text-text-dark">{createdDoctor.fullName}</div>
                <div className="mt-2 text-sm font-bold text-text-mid">{createdDoctor.phone}</div>
                {createdDoctor.email && <div className="text-sm font-bold text-text-light">{createdDoctor.email}</div>}
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="text-xs font-black uppercase tracking-[1.5px] text-amber-700">Mật khẩu khởi tạo</div>
                <div className="mt-2 break-all rounded-xl bg-white px-3 py-2 font-mono text-sm font-black text-text-dark">
                  {createdDoctor.initialPassword}
                </div>
                <Btn type="button" size="sm" variant="soft" className="mt-3" onClick={copyPassword}>
                  <Clipboard size={15} />
                  Sao chép mật khẩu
                </Btn>
              </div>

              <p className="text-sm font-semibold leading-6 text-text-light">
                Mật khẩu này chỉ nên chia sẻ riêng cho doctor. Doctor đăng nhập tại trang Doctor bằng số điện thoại và mật khẩu khởi tạo.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-lav-200 bg-[#fff9fb] p-6 text-sm font-semibold leading-6 text-text-light">
              Sau khi tạo thành công, thông tin doctor và mật khẩu khởi tạo sẽ hiển thị ở đây.
            </div>
          )}
        </Card>
      </div>
    </>
  );
};

export default AdminDoctorAccounts;
