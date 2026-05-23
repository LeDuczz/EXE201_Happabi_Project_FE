import { AlertCircle, BadgeCheck, CheckCircle2, ExternalLink, FileBadge, Loader2, RefreshCw, Search, ShieldCheck, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import Btn from '../components/common/Btn';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Topbar from '../components/layout/Topbar';
import type { NurseOnboarding } from '../types/nurseOnboarding';
import { getApiErrorMessage } from '../utils/apiError';

const DoctorNurseReview = () => {
  const [items, setItems] = useState<NurseOnboarding[]>([]);
  const [selected, setSelected] = useState<NurseOnboarding | null>(null);
  const [note, setNote] = useState('');
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewing, setIsReviewing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const filteredItems = items.filter((item) => {
    const haystack = `${item.fullName || ''} ${item.phone || ''} ${item.email || ''} ${item.city || ''}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  const loadPending = async () => {
    setError('');
    setIsLoading(true);
    try {
      const response = await axiosClient.get('/api/v1/doctor/nurses/pending-review');
      const nextItems = response.data?.data || [];
      setItems(nextItems);
      setSelected((current) => {
        if (!current) return nextItems[0] || null;
        return nextItems.find((item: NurseOnboarding) => item.profileId === current.profileId) || nextItems[0] || null;
      });
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Không tải được danh sách hồ sơ nurse chờ duyệt.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPending();
  }, []);

  const openUrl = async (url: string) => {
    setError('');
    try {
      const response = await axiosClient.get(url);
      const presignedUrl = response.data?.data;
      if (presignedUrl) window.open(presignedUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Không mở được tài liệu.'));
    }
  };

  const review = async (action: 'approve' | 'reject') => {
    if (!selected?.profileId) return;
    if (!note.trim()) {
      setError(action === 'approve' ? 'Vui lòng nhập ghi chú duyệt hồ sơ.' : 'Vui lòng nhập lý do từ chối.');
      return;
    }
    setError('');
    setSuccess('');
    setIsReviewing(true);
    try {
      await axiosClient.post(`/api/v1/doctor/nurses/${selected.profileId}/${action}`, { note });
      setSuccess(action === 'approve' ? 'Đã duyệt hồ sơ. Nurse sẽ nhận thông báo ký hợp đồng.' : 'Đã từ chối hồ sơ và gửi lý do cho nurse.');
      setNote('');
      await loadPending();
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsReviewing(false);
    }
  };

  return (
    <>
      <Topbar title="Duyệt hồ sơ nurse" subtitle="Doctor/Admin kiểm tra onboarding, CCCD, chứng chỉ và phản hồi cho nurse." />

      {(error || success) && (
        <div className={`mb-5 flex items-start gap-2 rounded-2xl border p-4 text-sm font-bold ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>
          {error ? <AlertCircle size={18} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0" />}
          <span>{error || success}</span>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <Card className="h-fit p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-lg font-black text-text-dark">Chờ duyệt</div>
              <div className="text-sm font-semibold text-text-light">{items.length} hồ sơ</div>
            </div>
            <Btn variant="soft" size="sm" onClick={loadPending} disabled={isLoading}>
              <RefreshCw size={15} /> Tải lại
            </Btn>
          </div>
          <Input placeholder="Tìm theo tên, SĐT, thành phố" value={query} onChange={(e) => setQuery(e.target.value)} icon={<Search size={16} />} />

          {isLoading ? (
            <div className="flex h-56 items-center justify-center">
              <Loader2 className="animate-spin text-lav-dark" />
            </div>
          ) : (
            <div className="max-h-[650px] space-y-3 overflow-auto pr-1">
              {filteredItems.map((item) => {
                const active = selected?.profileId === item.profileId;
                return (
                  <button
                    key={item.profileId}
                    type="button"
                    onClick={() => setSelected(item)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${active ? 'border-lav-300 bg-lav-100' : 'border-lav-100 bg-white hover:bg-[#fff9fb]'}`}
                  >
                    <div className="font-black text-text-dark">{item.fullName || 'Nurse chưa có tên'}</div>
                    <div className="mt-1 text-sm font-semibold text-text-light">{item.phone || item.email || 'Chưa có liên hệ'}</div>
                    <div className="mt-3 flex gap-2">
                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-lav-dark">{item.city || 'Chưa có TP'}</span>
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-black text-amber-700">PENDING_REVIEW</span>
                    </div>
                  </button>
                );
              })}
              {!filteredItems.length && (
                <div className="rounded-2xl border border-lav-100 bg-[#fff9fb] p-5 text-center text-sm font-bold text-text-light">
                  Không có hồ sơ nào đang chờ duyệt.
                </div>
              )}
            </div>
          )}
        </Card>

        <Card className="min-h-[720px] p-6">
          {!selected ? (
            <div className="flex h-[520px] items-center justify-center text-center">
              <div>
                <ShieldCheck className="mx-auto mb-3 text-lav-dark" size={38} />
                <div className="font-black text-text-dark">Chọn một hồ sơ để xem chi tiết</div>
                <p className="mt-2 text-sm font-semibold text-text-light">Khi nurse submit hồ sơ, hồ sơ sẽ xuất hiện ở đây.</p>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-5 flex items-start justify-between gap-4 border-b border-lav-100 pb-5">
                <div>
                  <div className="mb-2 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                    Đang chờ duyệt
                  </div>
                  <h1 className="text-2xl font-black text-text-dark">{selected.fullName || 'Nurse Happabi'}</h1>
                  <p className="mt-2 text-sm font-semibold text-text-mid">{selected.bio || 'Nurse chưa nhập giới thiệu.'}</p>
                </div>
                <div className="rounded-2xl bg-[#fff9fb] px-4 py-3 text-right">
                  <div className="text-xs font-black uppercase tracking-wide text-text-light">Kinh nghiệm</div>
                  <div className="mt-1 text-xl font-black text-lav-dark">{selected.experienceYears ?? 0} năm</div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Info label="Số giấy phép" value={selected.licenseNumber} />
                <Info label="Chuyên môn" value={selected.specialty} />
                <Info label="Ngày sinh" value={selected.dateOfBirth} />
                <Info label="Khu vực phục vụ" value={selected.serviceArea} />
                <Info label="Thành phố" value={selected.city} />
                <Info label="Địa chỉ" value={selected.address} />
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <section className="rounded-2xl border border-lav-100 bg-[#fff9fb] p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-black text-text-dark"><ShieldCheck size={17} /> CCCD/KYC</div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-lav-dark">{selected.kyc?.ekycStatus || 'PENDING'}</span>
                  </div>
                  <Info label="Số CCCD" value={selected.kyc?.cccdNumberMasked} />
                  <Info label="Tên CCCD" value={selected.kyc?.cccdName} />
                  <Info label="Ngày sinh CCCD" value={selected.kyc?.cccdDob} />
                  <Info label="Địa chỉ CCCD" value={selected.kyc?.cccdAddress} />
                  <div className="mt-3 flex gap-2">
                    <Btn variant="soft" size="sm" onClick={() => openUrl(`/api/v1/doctor/nurses/${selected.profileId}/kyc/front/url`)}>
                      <ExternalLink size={15} /> Mặt trước
                    </Btn>
                    <Btn variant="soft" size="sm" onClick={() => openUrl(`/api/v1/doctor/nurses/${selected.profileId}/kyc/back/url`)}>
                      <ExternalLink size={15} /> Mặt sau
                    </Btn>
                  </div>
                </section>

                <section className="rounded-2xl border border-lav-100 bg-[#fff9fb] p-5">
                  <div className="mb-4 flex items-center gap-2 font-black text-text-dark"><FileBadge size={17} /> Chứng chỉ</div>
                  <div className="space-y-3">
                    {(selected.certifications || []).map((cert) => (
                      <div key={cert.id} className="rounded-xl border border-lav-100 bg-white p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-black text-text-dark">{cert.certName}</div>
                            <div className="text-sm font-semibold text-text-light">{cert.issuedBy}</div>
                          </div>
                          <Btn variant="ghost" size="xs" onClick={() => openUrl(`/api/v1/doctor/nurses/certifications/${cert.id}/url`)}>
                            <ExternalLink size={14} /> Mở
                          </Btn>
                        </div>
                      </div>
                    ))}
                    {!selected.certifications?.length && <div className="text-sm font-bold text-text-light">Chưa có chứng chỉ.</div>}
                  </div>
                </section>
              </div>

              <div className="mt-6 rounded-2xl border border-lav-100 bg-white p-5">
                <div className="mb-3 font-black text-text-dark">Ghi chú duyệt hồ sơ</div>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                  placeholder="Nhập ghi chú approve hoặc lý do reject..."
                  className="mb-4 w-full resize-none rounded-xl border border-lav-200 bg-white px-3.5 py-3 text-[15px] font-semibold text-text-dark outline-none placeholder:text-text-light focus:border-lav-acc focus:ring-4 focus:ring-lav-100"
                />
                <div className="flex justify-end gap-3">
                  <Btn variant="danger" onClick={() => review('reject')} disabled={isReviewing}>
                    <XCircle size={16} /> Reject
                  </Btn>
                  <Btn onClick={() => review('approve')} disabled={isReviewing}>
                    <BadgeCheck size={16} /> Approve
                  </Btn>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </>
  );
};

const Info = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div className="mb-3">
    <div className="text-[11px] font-black uppercase tracking-wide text-text-light">{label}</div>
    <div className="mt-1 min-h-[20px] text-sm font-bold text-text-dark">{value || '-'}</div>
  </div>
);

export default DoctorNurseReview;
