import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  ClipboardList,
  Eye,
  FileBadge,
  IdCard,
  Image as ImageIcon,
  Loader2,
  ShieldCheck,
  UserRound,
  XCircle,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Btn from '../components/common/Btn';
import Card from '../components/common/Card';
import Topbar from '../components/layout/Topbar';
import type { NurseCertification, NurseOnboarding } from '../types/nurseOnboarding';
import { getApiErrorMessage } from '../utils/apiError';

type ReviewAction = 'approve' | 'reject';

const statusLabels: Record<string, string> = {
  PENDING_SUBMIT: 'Chưa nộp',
  PENDING_REVIEW: 'Chờ doctor duyệt',
  REJECTED: 'Bị từ chối',
  APPROVED_PENDING_CONTRACT: 'Chờ ký hợp đồng',
  ACTIVE: 'Đang hoạt động',
  SUSPENDED: 'Tạm khóa',
};

const ekycLabels: Record<string, string> = {
  PENDING: 'Chờ kiểm tra',
  PASSED: 'Đã đạt',
  REVIEW_NEEDED: 'Cần kiểm tra',
  FAILED: 'Không đạt',
};

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN').format(date);
};

const DoctorNurseReviewDetail = () => {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<NurseOnboarding | null>(null);
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDocumentLoading, setIsDocumentLoading] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!profileId) return;

    const loadDetail = async () => {
      setError('');
      setIsLoading(true);
      try {
        const response = await axiosClient.get(`/api/v1/doctor/nurses/${profileId}`);
        setSelected(response.data?.data || null);
      } catch (err: any) {
        setError(getApiErrorMessage(err, 'Không tải được chi tiết hồ sơ nurse.'));
      } finally {
        setIsLoading(false);
      }
    };

    void loadDetail();
  }, [profileId]);

  if (!profileId) return <Navigate to="/doctor/nurses/review" replace />;

  const openDocument = async (endpoint: string, loadingKey: string) => {
    setError('');
    setIsDocumentLoading(loadingKey);

    const popup = window.open('', '_blank');
    if (popup) {
      popup.document.write('<p style="font-family: sans-serif; padding: 24px;">Dang mo tai lieu...</p>');
    }

    try {
      const response = await axiosClient.get(endpoint, { responseType: 'blob' });
      const contentType = response.headers['content-type'];
      const blob = response.data instanceof Blob
        ? response.data
        : new Blob([response.data], { type: typeof contentType === 'string' ? contentType : 'application/octet-stream' });
      const url = URL.createObjectURL(blob);

      if (popup) {
        popup.location.replace(url);
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      } else {
        URL.revokeObjectURL(url);
        setError('Trình duyệt đã chặn tab mới. Vui lòng cho phép popup rồi thử lại.');
      }
    } catch (err: any) {
      popup?.close();
      setError(getApiErrorMessage(err, 'Không mở được tài liệu.'));
    } finally {
      setIsDocumentLoading('');
    }
  };

  const review = async (action: ReviewAction) => {
    if (!selected?.profileId) return;
    if (action === 'reject' && !note.trim()) {
      setError('Vui lòng nhập lý do từ chối để nurse biết cần sửa gì.');
      return;
    }

    setError('');
    setSuccess('');
    setIsReviewing(true);
    try {
      const reviewNote = note.trim() || 'Approved by doctor.';
      await axiosClient.post(`/api/v1/doctor/nurses/${selected.profileId}/${action}`, { note: reviewNote });
      setSuccess(action === 'approve'
        ? 'Đã duyệt hồ sơ. Nurse sẽ nhận thông báo ký hợp đồng.'
        : 'Đã từ chối hồ sơ và gửi lý do cho nurse.');
      setTimeout(() => navigate('/doctor/nurses/review'), 500);
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsReviewing(false);
    }
  };

  return (
    <>
      <Topbar
        title="Chi tiết hồ sơ nurse"
        subtitle="Đối chiếu thông tin, ảnh CCCD và chứng chỉ trước khi ra quyết định."
      />

      <div className="mb-5 flex items-center justify-between gap-3">
        <Btn variant="soft" onClick={() => navigate('/doctor/nurses/review')}>
          <ArrowLeft size={16} /> Quay lại danh sách
        </Btn>
      </div>

      {(error || success) && (
        <div className={`mb-5 flex items-start gap-2 rounded-2xl border p-4 text-sm font-bold ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>
          {error ? <AlertCircle size={18} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0" />}
          <span>{error || success}</span>
        </div>
      )}

      {isLoading ? (
        <Card className="flex min-h-[620px] items-center justify-center">
          <Loader2 className="animate-spin text-lav-dark" size={36} />
        </Card>
      ) : !selected ? (
        <Card className="flex min-h-[520px] items-center justify-center text-center">
          <div>
            <ShieldCheck className="mx-auto mb-3 text-lav-dark" size={38} />
            <div className="font-black text-text-dark">Không tìm thấy hồ sơ nurse</div>
            <p className="mt-2 text-sm font-semibold text-text-light">Hồ sơ có thể đã được duyệt hoặc không còn trong hàng chờ.</p>
          </div>
        </Card>
      ) : (
        <Card className="p-0">
          <ProfileHeader selected={selected} />

          <div className="grid gap-5 p-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-5">
              <Section title="Thông tin cá nhân" icon={<UserRound size={18} />}>
                <div className="grid gap-3 md:grid-cols-3">
                  <Info label="Họ tên" value={selected.fullName} />
                  <Info label="Số điện thoại" value={selected.phone} />
                  <Info label="Email" value={selected.email} />
                  <Info label="Ngày sinh" value={formatDate(selected.dateOfBirth)} />
                  <Info label="Chuyên môn" value={selected.specialty} />
                  <Info label="Kinh nghiệm" value={`${selected.experienceYears ?? 0} năm`} />
                  <Info label="Số giấy phép" value={selected.licenseNumber} />
                  <Info label="Thành phố" value={selected.city} />
                  <Info label="Khu vực phục vụ" value={selected.serviceArea} />
                </div>
                <Info label="Địa chỉ" value={selected.address} />
                <Info label="Giới thiệu" value={selected.bio} />
              </Section>

              <Section title="CCCD / KYC" icon={<IdCard size={18} />}>
                <div className="grid gap-3 md:grid-cols-2">
                  <Info label="Số CCCD" value={selected.kyc?.cccdNumber} />
                  <Info label="Trạng thái eKYC" value={ekycLabels[selected.kyc?.ekycStatus || ''] || selected.kyc?.ekycStatus} />
                  <Info label="Họ tên trên CCCD" value={selected.kyc?.cccdName} />
                  <Info label="Ngày sinh trên CCCD" value={selected.kyc?.cccdDob} />
                </div>
                <Info label="Địa chỉ trên CCCD" value={selected.kyc?.cccdAddress} />

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <DocumentButton
                    title="Xem mặt trước CCCD"
                    subtitle={selected.kyc?.hasFrontImage ? 'Mở ảnh trong tab mới' : 'Chưa có ảnh mặt trước'}
                    available={Boolean(selected.kyc?.hasFrontImage)}
                    loading={isDocumentLoading === 'kyc-front'}
                    icon={<ImageIcon size={18} />}
                    onClick={() => openDocument(`/api/v1/doctor/nurses/${selected.profileId}/kyc/front/file`, 'kyc-front')}
                  />
                  <DocumentButton
                    title="Xem mặt sau CCCD"
                    subtitle={selected.kyc?.hasBackImage ? 'Mở ảnh trong tab mới' : 'Chưa có ảnh mặt sau'}
                    available={Boolean(selected.kyc?.hasBackImage)}
                    loading={isDocumentLoading === 'kyc-back'}
                    icon={<ImageIcon size={18} />}
                    onClick={() => openDocument(`/api/v1/doctor/nurses/${selected.profileId}/kyc/back/file`, 'kyc-back')}
                  />
                </div>
              </Section>

              <Section title="Chứng chỉ" icon={<FileBadge size={18} />}>
                <div className="space-y-3">
                  {(selected.certifications || []).map((cert) => (
                    <CertificationCard
                      key={cert.id}
                      cert={cert}
                      loading={isDocumentLoading === `cert-${cert.id}`}
                      onOpen={() => openDocument(`/api/v1/doctor/nurses/certifications/${cert.id}/file`, `cert-${cert.id}`)}
                    />
                  ))}
                  {!selected.certifications?.length && (
                    <div className="rounded-2xl border border-lav-100 bg-[#fff9fb] p-4 text-sm font-bold text-text-light">
                      Nurse chưa upload chứng chỉ.
                    </div>
                  )}
                </div>
              </Section>

            </div>

            <aside className="space-y-5">
              <Section title="Checklist duyệt" icon={<ClipboardList size={18} />}>
                <div className="space-y-3">
                  <ChecklistItem label="Thông tin cá nhân" done={Boolean(selected.profileCompleted)} />
                  <ChecklistItem label="CCCD/KYC" done={Boolean(selected.kycCompleted)} />
                  <ChecklistItem label="Chứng chỉ" done={Boolean(selected.certificationsCompleted)} />
                  <ChecklistItem label="Ảnh mặt trước CCCD" done={Boolean(selected.kyc?.hasFrontImage)} />
                  <ChecklistItem label="Ảnh mặt sau CCCD" done={Boolean(selected.kyc?.hasBackImage)} />
                </div>
              </Section>

              <Section title="Quyết định" icon={<ShieldCheck size={18} />}>
                <label className="mb-2 block text-sm font-black text-text-dark">
                  Ghi chú cho nurse
                </label>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={6}
                  placeholder="Approve có thể để trống. Reject cần nhập rõ lý do để nurse sửa hồ sơ..."
                  className="mb-4 w-full resize-none rounded-xl border border-lav-200 bg-white px-3.5 py-3 text-[15px] font-semibold text-text-dark outline-none placeholder:text-text-light focus:border-lav-acc focus:ring-4 focus:ring-lav-100"
                />
                <div className="grid gap-3">
                  <Btn variant="danger" full onClick={() => review('reject')} disabled={isReviewing}>
                    <XCircle size={16} /> Reject hồ sơ
                  </Btn>
                  <Btn full onClick={() => review('approve')} disabled={isReviewing}>
                    <BadgeCheck size={16} /> Approve để ký contract
                  </Btn>
                </div>
              </Section>
            </aside>
          </div>
        </Card>
      )}
    </>
  );
};

const ProfileHeader = ({ selected }: { selected: NurseOnboarding }) => (
  <div className="border-b border-lav-100 bg-[#fff9fb] px-6 py-5">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <StatusPill value={selected.nurseStatus || 'PENDING_REVIEW'} />
        <h1 className="mt-3 text-2xl font-black text-text-dark">{selected.fullName || 'Nurse Happabi'}</h1>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-text-mid">
          {selected.bio || 'Nurse chưa nhập giới thiệu. Doctor nên kiểm tra đầy đủ KYC và chứng chỉ trước khi duyệt.'}
        </p>
      </div>
      <div className="grid min-w-[220px] grid-cols-2 gap-3">
        <Metric label="Kinh nghiệm" value={`${selected.experienceYears ?? 0} năm`} />
        <Metric label="Chứng chỉ" value={`${selected.certifications?.length || 0}`} />
      </div>
    </div>
  </div>
);

const Section = ({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) => (
  <section className="rounded-2xl border border-lav-100 bg-white p-5">
    <div className="mb-4 flex items-center gap-2 font-black text-text-dark">
      <span className="text-lav-dark">{icon}</span>
      {title}
    </div>
    {children}
  </section>
);

const Info = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div className="mb-3 rounded-xl bg-[#fff9fb] px-3.5 py-3">
    <div className="text-[11px] font-black uppercase tracking-wide text-text-light">{label}</div>
    <div className="mt-1 min-h-[20px] break-words text-sm font-bold text-text-dark">{value || '-'}</div>
  </div>
);

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-lav-100 bg-white px-4 py-3 text-right">
    <div className="text-[11px] font-black uppercase tracking-wide text-text-light">{label}</div>
    <div className="mt-1 text-xl font-black text-lav-dark">{value}</div>
  </div>
);

const StatusPill = ({ value }: { value: string }) => (
  <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-black text-amber-700">
    {statusLabels[value] || value}
  </span>
);

const ChecklistItem = ({ label, done }: { label: string; done: boolean }) => (
  <div className="flex items-center justify-between gap-3 rounded-xl border border-lav-100 bg-[#fff9fb] px-3.5 py-3">
    <span className="text-sm font-bold text-text-dark">{label}</span>
    {done ? <CheckCircle2 className="text-green-600" size={18} /> : <XCircle className="text-amber-600" size={18} />}
  </div>
);

const DocumentButton = ({
  title,
  subtitle,
  icon,
  available,
  loading,
  onClick,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  available: boolean;
  loading: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={!available || loading}
    className="flex min-h-[96px] w-full items-center justify-between gap-3 rounded-2xl border border-lav-100 bg-[#fff9fb] p-4 text-left transition hover:border-lav-300 hover:bg-lav-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-lav-100 disabled:hover:bg-[#fff9fb]"
  >
    <div className="flex items-center gap-3">
      <span className="rounded-xl bg-white p-2.5 text-lav-dark shadow-sm">{icon}</span>
      <span>
        <span className="block text-sm font-black text-text-dark">{title}</span>
        <span className="mt-1 block text-xs font-bold text-text-light">{subtitle}</span>
      </span>
    </div>
    {loading ? <Loader2 size={18} className="shrink-0 animate-spin text-lav-dark" /> : <Eye size={18} className="shrink-0 text-lav-dark" />}
  </button>
);

const CertificationCard = ({ cert, loading, onOpen }: { cert: NurseCertification; loading: boolean; onOpen: () => void }) => (
  <div className="rounded-2xl border border-lav-100 bg-[#fff9fb] p-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <div className="font-black text-text-dark">{cert.certName || 'Chứng chỉ nurse'}</div>
        <div className="mt-1 text-sm font-semibold text-text-light">{cert.issuedBy || 'Chưa có đơn vị cấp'}</div>
      </div>
      <Btn variant="soft" size="sm" onClick={onOpen} disabled={!cert.hasDocument || loading}>
        {loading ? <Loader2 size={15} className="animate-spin" /> : <Eye size={15} />} Xem file
      </Btn>
    </div>
    <div className="mt-4 grid gap-3 md:grid-cols-3">
      <Info label="Ngày cấp" value={formatDate(cert.issuedDate)} />
      <Info label="Ngày hết hạn" value={formatDate(cert.expiryDate)} />
      <Info label="Xác minh" value={cert.verified ? 'Đã xác minh' : 'Chưa xác minh'} />
    </div>
  </div>
);

export default DoctorNurseReviewDetail;
