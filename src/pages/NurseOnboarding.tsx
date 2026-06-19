import { AlertCircle, BadgeCheck, BriefcaseMedical, Camera, CheckCircle2, ClipboardCheck, FileCheck2, FileText, Loader2, PenLine, Send, ShieldCheck, Sparkles, Upload } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import axiosClient from '../api/axiosClient';
import Btn from '../components/common/Btn';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Topbar from '../components/layout/Topbar';
import { useAuth } from '../contexts/AuthContext';
import type { CccdOcrExtraction, NurseOnboarding, NurseSkillCode, NurseSpecialty, NurseStatus } from '../types/nurseOnboarding';
import { getApiErrorMessage, translateApiMessage } from '../utils/apiError';

const toIsoDate = (raw?: string) => {
  if (!raw) return '';
  const match = raw.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
  if (!match) return '';
  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

const cleanOcrLine = (value: string) => value.replace(/\s+/g, ' ').trim();

const extractAfterLabel = (lines: string[], labels: RegExp[]) => {
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const label = labels.find((pattern) => pattern.test(line));
    if (!label) continue;

    const inlineValue = cleanOcrLine(line.replace(label, '').replace(/^[:\-\s]+/, ''));
    if (inlineValue.length >= 3) return inlineValue;

    const nextLine = lines[index + 1];
    if (nextLine && nextLine.length >= 3) return nextLine;
  }
  return '';
};

const parseCccdText = (rawText: string, confidence?: number): CccdOcrExtraction => {
  const text = rawText.normalize('NFC');
  const lines = text
    .split(/\r?\n/)
    .map(cleanOcrLine)
    .filter(Boolean);

  const cccdNumber = text.match(/\b\d{12}\b/)?.[0] || text.match(/\b\d{9}\b/)?.[0] || '';
  const cccdDob = toIsoDate(text);
  const cccdName = extractAfterLabel(lines, [
    /^(họ\s*và\s*tên|ho\s*va\s*ten|full\s*name|name)\s*/i,
  ]) || lines.find((line) => (
    /^[A-ZÀ-Ỹ\s]{8,}$/.test(line) &&
    !/(VIET NAM|SOCIALIST|REPUBLIC|IDENTITY|CĂN CƯỚC|CONG HOA|QUOC|NAM)/i.test(line)
  )) || '';

  const cccdAddress = extractAfterLabel(lines, [
    /^(nơi\s*thường\s*trú|noi\s*thuong\s*tru|place\s*of\s*residence|residence)\s*/i,
    /^(quê\s*quán|que\s*quan|place\s*of\s*origin|origin)\s*/i,
  ]);

  const warnings: string[] = [];
  if (!cccdNumber) warnings.push('Không nhận diện được số CCCD. Vui lòng nhập thủ công.');
  if (!cccdName) warnings.push('Không nhận diện được họ tên trên CCCD. Vui lòng nhập thủ công.');
  if (!cccdDob) warnings.push('Không nhận diện được ngày sinh trên CCCD. Vui lòng nhập thủ công.');
  if (!cccdAddress) warnings.push('Không nhận diện được địa chỉ trên CCCD. Vui lòng nhập thủ công.');

  return {
    cccdNumber,
    cccdName,
    cccdDob,
    cccdAddress,
    confidence: confidence == null ? undefined : Math.max(0, Math.min(1, confidence / 100)),
    requiresManualReview: warnings.length > 0 || (confidence ?? 100) < 75,
    warnings,
  };
};

const stripVietnameseMarks = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

void parseCccdText;

const cleanLocalOcrLine = (value: string) => value.replace(/\s+/g, ' ').replace(/^[/:|\\\-\s]+/, '').trim();

const isLocalOcrLabel = (value: string) => {
  return /(place of origin|place of residence|date of birth|full name|name|sex|nationality|expiry|identity|citizen|republic|viet nam|cong hoa|quoc tich|gioi tinh|que quan|thuong tru|ngay sinh|ho va ten|can cuoc)/i.test(value);
};

const isUsefulLocalOcrValue = (value?: string) => Boolean(value && value.length >= 3 && !isLocalOcrLabel(value));

const extractLocalOcrValueAfterLabel = (lines: string[], labels: RegExp[]) => {
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const label = labels.find((pattern) => pattern.test(line));
    if (!label) continue;

    const inlineValue = cleanLocalOcrLine(line.replace(label, ''));
    if (isUsefulLocalOcrValue(inlineValue)) return inlineValue;

    for (let offset = 1; offset <= 3; offset += 1) {
      const nextLine = lines[index + offset];
      if (isUsefulLocalOcrValue(nextLine)) return nextLine;
    }
  }
  return '';
};

const extractLocalOcrName = (lines: string[]) => {
  const labeledName = extractLocalOcrValueAfterLabel(lines, [/^(ho va ten|full name|name)\b/i]);
  if (labeledName) return labeledName;

  return lines.find((line) => (
    /^[A-Z\s]{8,}$/.test(line) &&
    !isLocalOcrLabel(line) &&
    !/\d/.test(line)
  )) || '';
};

const parseCccdTextLocal = (rawText: string, confidence?: number): CccdOcrExtraction => {
  const normalizedText = stripVietnameseMarks(rawText);
  const lines = normalizedText
    .split(/\r?\n/)
    .map(cleanLocalOcrLine)
    .filter(Boolean);

  const cccdNumber = normalizedText.match(/\b\d{12}\b/)?.[0] || '';
  const cccdDob = toIsoDate(normalizedText);
  const cccdName = extractLocalOcrName(lines);
  const cccdAddress = extractLocalOcrValueAfterLabel(lines, [
    /^(noi thuong tru|place of residence|residence)\b/i,
    /^(que quan|place of origin|origin)\b/i,
  ]);

  const warnings: string[] = [];
  if (!cccdNumber) warnings.push('Không nhận diện được số CCCD. Vui lòng nhập thủ công.');
  if (!cccdName) warnings.push('Không nhận diện được họ tên trên CCCD. Vui lòng nhập thủ công.');
  if (!cccdDob) warnings.push('Không nhận diện được ngày sinh trên CCCD. Vui lòng nhập thủ công.');
  if (!cccdAddress) warnings.push('Không nhận diện được địa chỉ trên CCCD. Vui lòng nhập thủ công.');

  return {
    cccdNumber,
    cccdName,
    cccdDob,
    cccdAddress,
    confidence: confidence == null ? undefined : Math.max(0, Math.min(1, confidence / 100)),
    requiresManualReview: warnings.length > 0 || (confidence ?? 100) < 75,
    warnings,
  };
};

const statusMeta: Record<NurseStatus, { label: string; tone: string; description: string }> = {
  PENDING_SUBMIT: {
    label: 'Đang hoàn thiện hồ sơ',
    tone: 'border-lav-200 bg-lav-100 text-lav-dark',
    description: 'Hoàn tất thông tin cá nhân, CCCD và chứng chỉ để gửi duyệt.',
  },
  PENDING_REVIEW: {
    label: 'Đang chờ doctor duyệt',
    tone: 'border-amber-200 bg-amber-50 text-amber-700',
    description: 'Hồ sơ đã gửi thành công. Bạn sẽ nhận thông báo khi có kết quả.',
  },
  REJECTED: {
    label: 'Cần bổ sung hồ sơ',
    tone: 'border-red-200 bg-red-50 text-red-700',
    description: 'Doctor đã gửi lý do từ chối. Bạn có thể chỉnh sửa và gửi lại.',
  },
  APPROVED_PENDING_CONTRACT: {
    label: 'Đã duyệt, chờ ký hợp đồng',
    tone: 'border-blue-200 bg-blue-50 text-blue-700',
    description: 'Hồ sơ đã được duyệt. Vui lòng ký hợp đồng để kích hoạt tài khoản nurse.',
  },
  ACTIVE: {
    label: 'Đã kích hoạt',
    tone: 'border-green-200 bg-green-50 text-green-700',
    description: 'Tài khoản nurse đã sẵn sàng nhận lịch làm.',
  },
  SUSPENDED: {
    label: 'Tạm khóa',
    tone: 'border-slate-200 bg-slate-50 text-slate-700',
    description: 'Tài khoản nurse đang bị tạm khóa. Vui lòng liên hệ Happabi.',
  },
};

const specialtyLabels: Record<NurseSpecialty, string> = {
  NURSE: 'Điều dưỡng',
  MIDWIFE: 'Nữ hộ sinh',
  CAREGIVER: 'Chăm sóc viên',
};

const emptyOnboarding: NurseOnboarding = {
  nurseStatus: 'PENDING_SUBMIT',
  certifications: [],
};

const nurseSkillOptions: Array<{ code: NurseSkillCode; label: string; group: string }> = [
  { code: 'POSTPARTUM_RECOVERY_MASSAGE', label: 'Massage phục hồi sau sinh', group: 'Chăm sóc mẹ sau sinh' },
  { code: 'PRENATAL_RELAXATION_MASSAGE', label: 'Massage thư giãn mẹ bầu', group: 'Chăm sóc mẹ sau sinh' },
  { code: 'FOOT_PAIN_RELIEF_MASSAGE', label: 'Massage giảm đau vai gáy', group: 'Chăm sóc mẹ sau sinh' },
  { code: 'POSTPARTUM_BACK_SHOULDER_NECK_MASSAGE', label: 'Massage bụng giảm mỡ sau sinh', group: 'Chăm sóc mẹ sau sinh' },
  { code: 'LACTATION_STIMULATION', label: 'Kích sữa', group: 'Chăm sóc mẹ sau sinh' },
  { code: 'BLOCKED_MILK_DUCT_SUPPORT', label: 'Thông tắc tia sữa', group: 'Chăm sóc mẹ sau sinh' },
  { code: 'BREAST_CARE', label: 'Chăm sóc tuyến vú', group: 'Chăm sóc mẹ sau sinh' },
  { code: 'BREASTFEEDING_POSITION_GUIDANCE', label: 'Hướng dẫn cho bé bú đúng tư thế', group: 'Chăm sóc mẹ sau sinh' },
  { code: 'POSTPARTUM_HEALTH_MONITORING', label: 'Theo dõi sức khỏe mẹ sau sinh', group: 'Chăm sóc mẹ sau sinh' },
  { code: 'NEWBORN_BATHING', label: 'Tắm bé sơ sinh', group: 'Chăm sóc bé sơ sinh' },
  { code: 'NEWBORN_BASIC_CARE', label: 'Vệ sinh rốn cho bé', group: 'Chăm sóc bé sơ sinh' },
  { code: 'NEWBORN_HEALTH_MONITORING', label: 'Theo dõi sức khỏe bé sơ sinh', group: 'Chăm sóc bé sơ sinh' },
  { code: 'NEWBORN_SKIN_CARE', label: 'Chăm sóc da cho bé', group: 'Chăm sóc bé sơ sinh' },
  { code: 'HOME_NEWBORN_CARE_GUIDANCE', label: 'Hướng dẫn chăm sóc bé tại nhà', group: 'Chăm sóc bé sơ sinh' },
  { code: 'NEWBORN_WARNING_SIGN_RECOGNITION', label: 'Nhận biết dấu hiệu bất thường ở trẻ sơ sinh', group: 'Chăm sóc bé sơ sinh' },
  { code: 'PARENT_COMMUNICATION', label: 'Giao tiếp với phụ huynh', group: 'Kỹ năng mềm' },
  { code: 'MOTHER_BABY_CONSULTING', label: 'Tư vấn chăm sóc mẹ & bé', group: 'Kỹ năng mềm' },
  { code: 'SITUATION_HANDLING', label: 'Xử lý tình huống', group: 'Kỹ năng mềm' },
  { code: 'CUSTOMER_CARE', label: 'Chăm sóc khách hàng', group: 'Kỹ năng mềm' },
  { code: 'SCHEDULE_MANAGEMENT', label: 'Quản lý lịch hẹn', group: 'Kỹ năng mềm' },
];

const wizardSteps = [
  { title: 'Thông tin cá nhân', description: 'Nghề nghiệp và khu vực phục vụ' },
  { title: 'CCCD/KYC', description: 'OCR local hoặc nhập tay' },
  { title: 'Chứng chỉ', description: 'Upload hồ sơ chuyên môn' },
  { title: 'Gửi duyệt', description: 'Submit hoặc ký hợp đồng' },
];

const NurseOnboardingPage = () => {
  const { user } = useAuth();
  const frontInputRef = useRef<HTMLInputElement | null>(null);
  const backInputRef = useRef<HTMLInputElement | null>(null);
  const certInputRef = useRef<HTMLInputElement | null>(null);

  const [data, setData] = useState<NurseOnboarding>(emptyOnboarding);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [isSavingKyc, setIsSavingKyc] = useState(false);
  const [isUploadingCert, setIsUploadingCert] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeStep, setActiveStep] = useState(0);

  const [profileForm, setProfileForm] = useState({
    licenseNumber: '',
    dateOfBirth: '',
    specialty: 'NURSE' as NurseSpecialty,
    experienceYears: '',
    bio: '',
    serviceArea: '',
    address: '',
    city: '',
    skills: [] as NurseSkillCode[],
  });

  const [kycForm, setKycForm] = useState({
    cccdNumber: '',
    cccdName: '',
    cccdDob: '',
    cccdAddress: '',
  });
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [ocrResult, setOcrResult] = useState<CccdOcrExtraction | null>(null);

  const [certForm, setCertForm] = useState({
    certName: '',
    issuedBy: '',
    issuedDate: '',
    expiryDate: '',
  });
  const [certFile, setCertFile] = useState<File | null>(null);

  const [contractAgreed, setContractAgreed] = useState(false);
  const [signedName, setSignedName] = useState(user?.fullName || '');

  const status = data.nurseStatus || 'PENDING_SUBMIT';
  const meta = statusMeta[status];
  const editable = status === 'PENDING_SUBMIT' || status === 'REJECTED';
  const completion = useMemo(() => [
    { label: 'Thông tin cá nhân', done: Boolean(data.profileCompleted), icon: <BriefcaseMedical size={16} /> },
    { label: 'CCCD/KYC', done: Boolean(data.kycCompleted), icon: <ShieldCheck size={16} /> },
    { label: 'Chứng chỉ', done: Boolean(data.certificationsCompleted), icon: <FileCheck2 size={16} /> },
    { label: 'Hợp đồng', done: Boolean(data.contractSigned), icon: <PenLine size={16} /> },
  ], [data.certificationsCompleted, data.contractSigned, data.kycCompleted, data.profileCompleted]);

  const hydrateForms = (next: NurseOnboarding) => {
    setData({ ...emptyOnboarding, ...next, certifications: next.certifications || [] });
    setProfileForm({
      licenseNumber: next.licenseNumber || '',
      dateOfBirth: next.dateOfBirth || '',
      specialty: next.specialty || 'NURSE',
      experienceYears: next.experienceYears == null ? '' : String(next.experienceYears),
      bio: next.bio || '',
      serviceArea: next.serviceArea || '',
      address: next.address || '',
      city: next.city || '',
      skills: (next.skills || []).map((skill) => skill.skill),
    });
    setKycForm({
      cccdNumber: next.kyc?.cccdNumber || '',
      cccdName: next.kyc?.cccdName || '',
      cccdDob: next.kyc?.cccdDob || '',
      cccdAddress: next.kyc?.cccdAddress || '',
    });
    setSignedName(next.fullName || user?.fullName || '');

    if (next.nurseStatus === 'APPROVED_PENDING_CONTRACT' || next.nurseStatus === 'PENDING_REVIEW' || next.nurseStatus === 'ACTIVE') {
      setActiveStep(3);
    } else if (!next.profileCompleted) {
      setActiveStep(0);
    } else if (!next.kycCompleted) {
      setActiveStep(1);
    } else if (!next.certificationsCompleted) {
      setActiveStep(2);
    }
  };

  const loadOnboarding = async () => {
    setError('');
    try {
      const response = await axiosClient.get('/api/v1/nurses/me/onboarding');
      hydrateForms(response.data?.data || emptyOnboarding);
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Không tải được hồ sơ nurse.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadOnboarding();
  }, []);

  const saveProfile = async (event?: React.FormEvent, goNext = false) => {
    event?.preventDefault();
    setError('');
    setSuccess('');
    setIsSavingProfile(true);
    try {
      const response = await axiosClient.patch('/api/v1/nurses/me/onboarding/profile', {
        ...profileForm,
        experienceYears: profileForm.experienceYears === '' ? null : Number(profileForm.experienceYears),
        skills: profileForm.skills,
      });
      hydrateForms(response.data?.data);
      setSuccess('Đã lưu thông tin cá nhân.');
      if (goNext) setActiveStep(1);
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const runOcr = async (file: File) => {
    setError('');
    setSuccess('');
    setIsOcrLoading(true);
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('vie+eng');
      const result = await worker.recognize(file);
      await worker.terminate();

      const extracted = parseCccdTextLocal(result.data.text, result.data.confidence);
      setOcrResult(extracted);
      const hasExtractedFields = Boolean(extracted.cccdNumber || extracted.cccdName || extracted.cccdDob || extracted.cccdAddress);
      if (hasExtractedFields) {
        setKycForm((current) => ({
          cccdNumber: extracted.cccdNumber || current.cccdNumber,
          cccdName: extracted.cccdName || current.cccdName,
          cccdDob: extracted.cccdDob || current.cccdDob,
          cccdAddress: extracted.cccdAddress || current.cccdAddress,
        }));
        setSuccess('OCR local đã đọc thông tin CCCD. Vui lòng kiểm tra lại trước khi lưu KYC.');
      } else {
        setSuccess('OCR local chưa đọc được thông tin từ ảnh. Bạn vẫn có thể nhập CCCD thủ công và lưu KYC.');
      }
    } catch (err: any) {
      setOcrResult({
        confidence: 0,
        requiresManualReview: true,
        warnings: ['OCR local không khả dụng hoặc không đọc được ảnh. Vui lòng nhập CCCD thủ công.'],
      });
      setError(getApiErrorMessage(err, 'OCR local không đọc được thông tin CCCD từ ảnh. Bạn có thể nhập thủ công.'));
    } finally {
      setIsOcrLoading(false);
    }
  };

  const saveKyc = async (event?: React.FormEvent, goNext = false) => {
    event?.preventDefault();
    setError('');
    setSuccess('');
    setIsSavingKyc(true);
    try {
      const formData = new FormData();
      Object.entries(kycForm).forEach(([key, value]) => formData.append(key, value));
      if (frontImage) formData.append('frontImage', frontImage);
      if (backImage) formData.append('backImage', backImage);

      const response = await axiosClient.post('/api/v1/nurses/me/onboarding/kyc', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      hydrateForms(response.data?.data);
      setSuccess('Đã lưu thông tin CCCD/KYC.');
      if (goNext) setActiveStep(2);
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSavingKyc(false);
    }
  };

  const uploadCertification = async (event?: React.FormEvent, goNext = false) => {
    event?.preventDefault();
    setError('');
    setSuccess('');
    if (!certFile) {
      setError('Vui lòng chọn file chứng chỉ.');
      return;
    }
    setIsUploadingCert(true);
    try {
      const formData = new FormData();
      Object.entries(certForm).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });
      formData.append('document', certFile);
      await axiosClient.post('/api/v1/nurses/me/onboarding/certifications', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCertForm({ certName: '', issuedBy: '', issuedDate: '', expiryDate: '' });
      setCertFile(null);
      if (certInputRef.current) certInputRef.current.value = '';
      setSuccess('Đã tải chứng chỉ lên.');
      await loadOnboarding();
      if (goNext) setActiveStep(3);
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsUploadingCert(false);
    }
  };

  const submitForReview = async () => {
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    try {
      const response = await axiosClient.post('/api/v1/nurses/me/onboarding/submit');
      hydrateForms(response.data?.data);
      setSuccess('Hồ sơ đã được gửi cho doctor duyệt.');
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const signContract = async () => {
    setError('');
    setSuccess('');
    setIsSigning(true);
    try {
      const response = await axiosClient.post('/api/v1/nurses/me/onboarding/contract/sign', {
        agreed: contractAgreed,
        signedName,
      });
      hydrateForms(response.data?.data);
      setSuccess('Đã ký hợp đồng. Tài khoản nurse đã được kích hoạt.');
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSigning(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Topbar title="Onboarding nurse" subtitle="Đang tải hồ sơ nurse." />
        <Card className="flex h-[420px] items-center justify-center">
          <Loader2 className="animate-spin text-lav-dark" size={34} />
        </Card>
      </>
    );
  }

  return (
    <>
      <Topbar title="Onboarding nurse" subtitle="Hoàn thiện hồ sơ, KYC bằng OCR local hoặc nhập tay, chứng chỉ và hợp đồng." />

      <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_340px]">
        <Card className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className={`mb-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${meta.tone}`}>{meta.label}</div>
              <h1 className="text-2xl font-semibold text-text-dark">{data.fullName || user?.fullName || 'Nurse Happabi'}</h1>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-text-mid">{meta.description}</p>
              {status === 'REJECTED' && data.rejectionReason && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                  Lý do từ chối: {data.rejectionReason}
                </div>
              )}
            </div>
            {status === 'ACTIVE' && (
              <Btn onClick={() => window.location.assign('/nurse/home')}>
                <BadgeCheck size={16} /> Vào homepage
              </Btn>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 text-sm font-semibold text-text-dark">Tiến độ hồ sơ</div>
          <div className="space-y-3">
            {completion.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-xl border border-lav-100 bg-[#fff9fb] px-3 py-2.5">
                <span className="flex items-center gap-2 text-sm font-bold text-text-mid">{item.icon}{item.label}</span>
                {item.done ? <CheckCircle2 size={17} className="text-green-600" /> : <span className="h-2.5 w-2.5 rounded-full bg-lav-200" />}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mb-5 p-5">
        <div className="grid grid-cols-4 gap-3">
          {wizardSteps.map((step, index) => {
            const isActive = activeStep === index;
            const isDone =
              index === 0 ? Boolean(data.profileCompleted) :
              index === 1 ? Boolean(data.kycCompleted) :
              index === 2 ? Boolean(data.certificationsCompleted) :
              status === 'PENDING_REVIEW' || status === 'APPROVED_PENDING_CONTRACT' || status === 'ACTIVE';

            return (
              <button
                key={step.title}
                type="button"
                onClick={() => setActiveStep(index)}
                className={`relative rounded-2xl border px-4 py-3 text-left transition ${
                  isActive
                    ? 'border-lav-300 bg-lav-100 shadow-[0_8px_24px_rgba(168,85,247,.12)]'
                    : 'border-lav-100 bg-[#fff9fb] hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                    isDone ? 'bg-green-100 text-green-700' : isActive ? 'bg-grad text-white' : 'bg-white text-text-light'
                  }`}>
                    {isDone ? <CheckCircle2 size={17} /> : index + 1}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-text-dark">{step.title}</span>
                    <span className="mt-0.5 block text-xs font-semibold text-text-light">{step.description}</span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {(error || success) && (
        <div className={`mb-5 flex items-start gap-2 rounded-2xl border p-4 text-sm font-bold ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>
          {error ? <AlertCircle size={18} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0" />}
          <span>{error || success}</span>
        </div>
      )}

      <div className="grid gap-5">
        {activeStep === 0 && <Card className="p-6">
          <div className="mb-5 flex items-center justify-between border-b border-lav-100 pb-4">
            <div>
              <h2 className="text-xl font-semibold text-text-dark">1. Thông tin cá nhân và nghề nghiệp</h2>
              <p className="mt-1 text-sm font-semibold text-text-light">Thông tin này dùng để doctor kiểm tra năng lực hành nghề.</p>
            </div>
            {!editable && <span className="rounded-full bg-lav-100 px-3 py-1 text-xs font-semibold text-lav-dark">Đã khóa chỉnh sửa</span>}
          </div>
          <form onSubmit={(event) => saveProfile(event, true)}>
            <div className="grid gap-x-5 md:grid-cols-3">
              <Input label="Số giấy phép" value={profileForm.licenseNumber} disabled={!editable} onChange={(e) => setProfileForm((cur) => ({ ...cur, licenseNumber: e.target.value }))} required />
              <Input label="Ngày sinh" type="date" value={profileForm.dateOfBirth} disabled={!editable} onChange={(e) => setProfileForm((cur) => ({ ...cur, dateOfBirth: e.target.value }))} />
              <div className="mb-4">
                <div className="mb-1.5 text-[12.5px] font-bold tracking-[0.3px] text-text-mid">Chuyên môn</div>
                <select
                  value={profileForm.specialty}
                  disabled={!editable}
                  onChange={(e) => setProfileForm((cur) => ({ ...cur, specialty: e.target.value as NurseSpecialty }))}
                  className="w-full rounded-xl border border-lav-200 bg-white px-3.5 py-3 text-[15px] font-semibold text-text-dark outline-none focus:border-lav-acc focus:ring-4 focus:ring-lav-100 disabled:bg-lav-100 disabled:text-text-light"
                >
                  {Object.entries(specialtyLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              <Input label="Số năm kinh nghiệm" type="number" min={0} max={60} value={profileForm.experienceYears} disabled={!editable} onChange={(e) => setProfileForm((cur) => ({ ...cur, experienceYears: e.target.value }))} />
              <Input label="Khu vực phục vụ" value={profileForm.serviceArea} disabled={!editable} onChange={(e) => setProfileForm((cur) => ({ ...cur, serviceArea: e.target.value }))} />
              <Input label="Thành phố" value={profileForm.city} disabled={!editable} onChange={(e) => setProfileForm((cur) => ({ ...cur, city: e.target.value }))} />
            </div>
            <Input label="Địa chỉ" value={profileForm.address} disabled={!editable} onChange={(e) => setProfileForm((cur) => ({ ...cur, address: e.target.value }))} />
            <div className="mb-4 rounded-2xl border border-lav-100 bg-[#fff9fb] p-4">
              <div className="mb-3">
                <div className="text-[13px] font-semibold text-text-dark">Kỹ năng có thể nhận dịch vụ</div>
                <div className="mt-1 text-xs font-bold text-text-light">
                  Nurse tự khai báo, doctor sẽ xác minh khi duyệt hồ sơ. Booking chỉ dùng kỹ năng đã xác minh.
                </div>
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                {['Chăm sóc mẹ sau sinh', 'Chăm sóc bé sơ sinh', 'Kỹ năng mềm'].map((group) => (
                  <div key={group}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-lav-dark">{group}</p>
                    <div className="space-y-2">
                      {nurseSkillOptions.filter((option) => option.group === group).map((option) => {
                        const checked = profileForm.skills.includes(option.code);
                        const verified = data.skills?.some((skill) => skill.skill === option.code && skill.verified);
                        return (
                          <label
                            key={option.code}
                            className={`flex cursor-pointer items-start gap-2 rounded-xl border px-3 py-2 text-xs font-bold ${
                              checked ? 'border-lav-300 bg-white text-text-dark' : 'border-lav-100 bg-white/60 text-text-mid'
                            } ${!editable ? 'cursor-not-allowed opacity-75' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={!editable}
                              onChange={(event) => {
                                setProfileForm((current) => ({
                                  ...current,
                                  skills: event.target.checked
                                    ? [...current.skills, option.code]
                                    : current.skills.filter((skill) => skill !== option.code),
                                }));
                              }}
                              className="mt-0.5 h-4 w-4 accent-lav-dark"
                            />
                            <span>
                              <span>{option.label}</span>
                              {verified && <span className="ml-2 text-green-700">Đã xác minh</span>}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <div className="mb-1.5 text-[12.5px] font-bold tracking-[0.3px] text-text-mid">Giới thiệu ngắn</div>
              <textarea
                value={profileForm.bio}
                disabled={!editable}
                onChange={(e) => setProfileForm((cur) => ({ ...cur, bio: e.target.value }))}
                rows={4}
                className="w-full resize-none rounded-xl border border-lav-200 bg-white px-3.5 py-3 text-[15px] font-semibold text-text-dark outline-none focus:border-lav-acc focus:ring-4 focus:ring-lav-100 disabled:bg-lav-100 disabled:text-text-light"
              />
            </div>
            <div className="flex justify-end">
              <Btn type="submit" disabled={!editable || isSavingProfile}>
                <FileText size={16} /> {isSavingProfile ? 'Đang lưu...' : 'Lưu và tiếp tục'}
              </Btn>
            </div>
          </form>
        </Card>}

        {activeStep === 1 && <Card className="p-6">
          <div className="mb-5 flex items-center justify-between border-b border-lav-100 pb-4">
            <div>
              <h2 className="text-xl font-semibold text-text-dark">2. CCCD và OCR local</h2>
              <p className="mt-1 text-sm font-semibold text-text-light">Upload mặt trước CCCD để OCR local đọc gợi ý, sau đó kiểm tra hoặc nhập tay trước khi lưu.</p>
            </div>
            {ocrResult?.confidence != null && (
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                Độ tin cậy {Math.round(ocrResult.confidence * 100)}%
              </span>
            )}
          </div>

          <form onSubmit={(event) => saveKyc(event, true)}>
            <div className="mb-5 grid gap-4 md:grid-cols-2">
              <button
                type="button"
                disabled={!editable || isOcrLoading}
                onClick={() => frontInputRef.current?.click()}
                className="flex min-h-[132px] flex-col items-center justify-center rounded-2xl border border-dashed border-lav-300 bg-[#fff9fb] p-5 text-center transition hover:bg-lav-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isOcrLoading ? <Loader2 className="mb-2 animate-spin text-lav-dark" /> : <Camera className="mb-2 text-lav-dark" />}
                <div className="text-sm font-semibold text-text-dark">{frontImage ? frontImage.name : 'Upload CCCD mặt trước và đọc OCR local'}</div>
                <div className="mt-1 text-xs font-bold text-text-light">JPEG, PNG hoặc WebP</div>
              </button>
              <button
                type="button"
                disabled={!editable}
                onClick={() => backInputRef.current?.click()}
                className="flex min-h-[132px] flex-col items-center justify-center rounded-2xl border border-dashed border-lav-300 bg-[#fff9fb] p-5 text-center transition hover:bg-lav-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Upload className="mb-2 text-lav-dark" />
                <div className="text-sm font-semibold text-text-dark">{backImage ? backImage.name : 'Upload CCCD mặt sau'}</div>
                <div className="mt-1 text-xs font-bold text-text-light">Dùng để doctor đối chiếu khi duyệt</div>
              </button>
              <input
                ref={frontInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setFrontImage(file);
                  void runOcr(file);
                }}
              />
              <input
                ref={backInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(event) => setBackImage(event.target.files?.[0] || null)}
              />
            </div>

            {ocrResult?.requiresManualReview && (
              <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-700">
                OCR chưa đủ chắc chắn. Vui lòng kiểm tra kỹ thông tin CCCD trước khi lưu.
              </div>
            )}
            {!!ocrResult?.warnings?.length && (
              <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                <div className="mb-2 flex items-center gap-2 font-semibold"><Sparkles size={16} /> Cảnh báo OCR</div>
                <ul className="list-disc space-y-1 pl-5 font-semibold">
                  {ocrResult.warnings.map((warning) => <li key={warning}>{translateApiMessage(warning)}</li>)}
                </ul>
              </div>
            )}

            <div className="grid gap-x-5 md:grid-cols-2">
              <Input label="Số CCCD" value={kycForm.cccdNumber} disabled={!editable} onChange={(e) => setKycForm((cur) => ({ ...cur, cccdNumber: e.target.value }))} required />
              <Input label="Họ tên trên CCCD" value={kycForm.cccdName} disabled={!editable} onChange={(e) => setKycForm((cur) => ({ ...cur, cccdName: e.target.value }))} required />
              <Input label="Ngày sinh trên CCCD" type="date" value={kycForm.cccdDob} disabled={!editable} onChange={(e) => setKycForm((cur) => ({ ...cur, cccdDob: e.target.value }))} />
              <Input label="Địa chỉ trên CCCD" value={kycForm.cccdAddress} disabled={!editable} onChange={(e) => setKycForm((cur) => ({ ...cur, cccdAddress: e.target.value }))} />
            </div>

            <div className="flex justify-between">
              <Btn type="button" variant="soft" onClick={() => setActiveStep(0)}>
                Quay lại
              </Btn>
              <Btn type="submit" disabled={!editable || isSavingKyc}>
                <ShieldCheck size={16} /> {isSavingKyc ? 'Đang lưu KYC...' : 'Lưu KYC và tiếp tục'}
              </Btn>
            </div>
          </form>
        </Card>}

        {activeStep === 2 && <Card className="p-6">
          <div className="mb-5 flex items-center justify-between border-b border-lav-100 pb-4">
            <div>
              <h2 className="text-xl font-semibold text-text-dark">3. Chứng chỉ hành nghề</h2>
              <p className="mt-1 text-sm font-semibold text-text-light">Tải ít nhất một chứng chỉ để hồ sơ đủ điều kiện gửi duyệt.</p>
            </div>
            <span className="rounded-full bg-lav-100 px-3 py-1 text-xs font-semibold text-lav-dark">{data.certifications?.length || 0} chứng chỉ</span>
          </div>

          <form onSubmit={(event) => uploadCertification(event, true)} className="mb-5 rounded-2xl border border-lav-100 bg-[#fff9fb] p-4">
            <div className="grid gap-x-4 md:grid-cols-4">
              <Input label="Tên chứng chỉ" value={certForm.certName} disabled={!editable} onChange={(e) => setCertForm((cur) => ({ ...cur, certName: e.target.value }))} required />
              <Input label="Nơi cấp" value={certForm.issuedBy} disabled={!editable} onChange={(e) => setCertForm((cur) => ({ ...cur, issuedBy: e.target.value }))} required />
              <Input label="Ngày cấp" type="date" value={certForm.issuedDate} disabled={!editable} onChange={(e) => setCertForm((cur) => ({ ...cur, issuedDate: e.target.value }))} />
              <Input label="Ngày hết hạn" type="date" value={certForm.expiryDate} disabled={!editable} onChange={(e) => setCertForm((cur) => ({ ...cur, expiryDate: e.target.value }))} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                disabled={!editable}
                onClick={() => certInputRef.current?.click()}
                className="flex min-h-[46px] flex-1 items-center justify-center rounded-xl border border-dashed border-lav-300 bg-white px-4 text-sm font-semibold text-text-mid disabled:opacity-60"
              >
                {certFile ? certFile.name : 'Chọn file chứng chỉ'}
              </button>
              <input ref={certInputRef} type="file" className="hidden" onChange={(event) => setCertFile(event.target.files?.[0] || null)} />
              <Btn type="submit" disabled={!editable || isUploadingCert}>
                <Upload size={16} /> {isUploadingCert ? 'Đang lưu...' : 'Lưu chứng chỉ và tiếp tục'}
              </Btn>
            </div>
          </form>

          <div className="grid gap-3 md:grid-cols-2">
            {(data.certifications || []).map((cert) => (
              <div key={cert.id} className="rounded-2xl border border-lav-100 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-text-dark">{cert.certName}</div>
                    <div className="mt-1 text-sm font-semibold text-text-light">{cert.issuedBy}</div>
                    <div className="mt-2 text-xs font-bold text-text-light">Cấp ngày {cert.issuedDate || '-'} {cert.expiryDate ? `- Hết hạn ${cert.expiryDate}` : ''}</div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cert.verified ? 'bg-green-50 text-green-700' : 'bg-lav-100 text-lav-dark'}`}>
                    {cert.verified ? 'Đã xác thực' : 'Chờ duyệt'}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-between">
            <Btn type="button" variant="soft" onClick={() => setActiveStep(1)}>
              Quay lại
            </Btn>
            <Btn type="button" disabled={!data.certifications?.length} onClick={() => setActiveStep(3)}>
              Tiếp tục
            </Btn>
          </div>
        </Card>}

        {activeStep === 3 && <Card className="p-6">
          <div className="mb-5 flex items-center justify-between border-b border-lav-100 pb-4">
            <div>
              <h2 className="text-xl font-semibold text-text-dark">4. Gửi duyệt và hợp đồng</h2>
              <p className="mt-1 text-sm font-semibold text-text-light">Doctor duyệt hồ sơ trước, sau đó nurse ký hợp đồng để kích hoạt.</p>
            </div>
            <ClipboardCheck className="text-lav-dark" />
          </div>

          {status === 'APPROVED_PENDING_CONTRACT' ? (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
              <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-blue-800"><PenLine size={18} /> Ký hợp đồng nurse</div>
              <p className="mb-4 text-sm font-semibold leading-6 text-blue-700">
                Hợp đồng phiên bản {data.latestContract?.contractVersion || 'hiện tại'} đã sẵn sàng. Sau khi ký, tài khoản nurse sẽ chuyển sang trạng thái active.
              </p>
              <Input label="Tên người ký" value={signedName} onChange={(e) => setSignedName(e.target.value)} />
              <label className="mb-4 flex cursor-pointer items-start gap-2 text-sm font-bold text-blue-800">
                <input type="checkbox" checked={contractAgreed} onChange={(e) => setContractAgreed(e.target.checked)} className="mt-1 h-4 w-4 accent-lav-dark" />
                Tôi đã đọc và đồng ý với điều khoản hợp đồng hợp tác nurse của Happabi.
              </label>
              <div className="flex justify-between gap-3">
                <Btn type="button" variant="soft" onClick={() => setActiveStep(2)}>
                  Quay lại
                </Btn>
                <Btn onClick={signContract} disabled={isSigning}>
                <PenLine size={16} /> {isSigning ? 'Đang ký...' : 'Ký hợp đồng'}
                </Btn>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-lav-100 bg-[#fff9fb] p-5">
              <div>
                <div className="font-semibold text-text-dark">Sẵn sàng gửi doctor duyệt?</div>
                <p className="mt-1 text-sm font-semibold text-text-light">Nút gửi chỉ thành công khi đủ thông tin cá nhân, KYC và chứng chỉ.</p>
              </div>
              <div className="flex gap-3">
                <Btn type="button" variant="soft" onClick={() => setActiveStep(2)}>
                  Quay lại
                </Btn>
                <Btn onClick={submitForReview} disabled={!editable || isSubmitting}>
                  <Send size={16} /> {isSubmitting ? 'Đang gửi...' : 'Gửi duyệt'}
                </Btn>
              </div>
            </div>
          )}
        </Card>}
      </div>
    </>
  );
};

export default NurseOnboardingPage;
