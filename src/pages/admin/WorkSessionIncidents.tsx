import { AlertTriangle, CheckCircle2, Eye, Image as ImageIcon, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { adminIncidentApi, type WorkSessionIncidentStatus } from '../../api/adminIncidentApi';
import Btn from '../../components/common/Btn';
import Card from '../../components/common/Card';
import Topbar from '../../components/layout/Topbar';
import type { WorkSessionIncident } from '../../types/workSession';
import { getApiErrorMessage } from '../../utils/apiError';

const statusLabel: Record<WorkSessionIncidentStatus, string> = {
  PENDING_REVIEW: 'Chờ kiểm tra',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Đã từ chối',
};

const statusClass: Record<WorkSessionIncidentStatus, string> = {
  PENDING_REVIEW: 'border-amber-200 bg-amber-50 text-amber-700',
  APPROVED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  REJECTED: 'border-rose-200 bg-rose-50 text-rose-700',
};

const typeLabel: Record<string, string> = {
  MOTHER_UNREACHABLE: 'Không liên lạc được mẹ',
  NURSE_CANCELLATION: 'Nurse hủy ca',
  NURSE_NO_SHOW: 'Nurse bỏ ca',
  OTHER: 'Sự cố khác',
};

const formatDateTime = (value?: string) => {
  if (!value) return '--';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
};

const AdminWorkSessionIncidents = () => {
  const [incidents, setIncidents] = useState<WorkSessionIncident[]>([]);
  const [activeStatus, setActiveStatus] = useState<WorkSessionIncidentStatus | 'ALL'>('PENDING_REVIEW');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [noShowWorkSessionId, setNoShowWorkSessionId] = useState('');
  const [noShowNote, setNoShowNote] = useState('');

  const loadIncidents = async () => {
    setIsLoading(true);
    setError('');
    try {
      const page = await adminIncidentApi.getIncidents(activeStatus === 'ALL' ? undefined : activeStatus);
      const content = page.content ?? [];
      setIncidents(content);
      setSelectedId((current) => current && content.some((item) => item.id === current) ? current : content[0]?.id ?? null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không tải được danh sách sự cố ca làm.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadIncidents();
  }, [activeStatus]);

  const selectedIncident = useMemo(
    () => incidents.find((item) => item.id === selectedId) ?? incidents[0] ?? null,
    [incidents, selectedId],
  );

  const reviewIncident = async (decision: 'APPROVE' | 'REJECT') => {
    if (!selectedIncident) return;
    setActionId(decision);
    setError('');
    setSuccess('');
    try {
      if (decision === 'APPROVE') {
        await adminIncidentApi.approve(selectedIncident.id, adminNote);
        setSuccess('Đã duyệt sự cố và đóng ca theo chính sách.');
      } else {
        await adminIncidentApi.reject(selectedIncident.id, adminNote);
        setSuccess('Đã từ chối báo cáo sự cố.');
      }
      setAdminNote('');
      await loadIncidents();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không xử lý được sự cố.'));
    } finally {
      setActionId(null);
    }
  };

  const markNurseNoShow = async () => {
    const workSessionId = noShowWorkSessionId.trim();
    if (!workSessionId) {
      setError('Vui lòng nhập mã ca làm.');
      return;
    }
    setActionId('NURSE_NO_SHOW');
    setError('');
    setSuccess('');
    try {
      await adminIncidentApi.markNurseNoShow(workSessionId, noShowNote);
      setSuccess('Đã ghi nhận nurse bỏ ca và áp dụng chính sách phạt.');
      setNoShowWorkSessionId('');
      setNoShowNote('');
      await loadIncidents();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không xử lý được ca nurse bỏ ca.'));
    } finally {
      setActionId(null);
    }
  };
  const pendingCount = incidents.filter((item) => item.status === 'PENDING_REVIEW').length;

  return (
    <div className="pb-10">
      <Topbar
        title="Sự cố ca làm"
        subtitle="Kiểm tra báo cáo không liên lạc được, bằng chứng và quyết định xử lý ca."
      />

      {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}
      {success && <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{success}</div>}

      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ALL'] as Array<WorkSessionIncidentStatus | 'ALL'>).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setActiveStatus(status)}
              className={`whitespace-nowrap rounded-full px-5 py-2 text-xs font-black transition ${
                activeStatus === status
                  ? 'bg-lav-acc text-white shadow-[0_8px_22px_rgba(192,132,252,.25)]'
                  : 'bg-white text-lav-dark ring-1 ring-lav-200 hover:bg-lav-50'
              }`}
            >
              {status === 'ALL' ? 'Tất cả' : statusLabel[status]}
            </button>
          ))}
        </div>

        <Btn variant="soft" size="sm" onClick={loadIncidents} disabled={isLoading}>
          <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          Làm mới
        </Btn>
      </div>

      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <div className="text-xs font-black uppercase tracking-wider text-text-light">Cần kiểm tra</div>
          <div className="mt-2 text-3xl font-black text-text-dark">{pendingCount}</div>
        </Card>
        <Card className="p-5 md:col-span-2">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <AlertTriangle size={19} />
            </div>
            <div>
              <div className="text-sm font-black text-text-dark">Quy tắc xử lý</div>
              <p className="mt-1 text-sm font-semibold leading-6 text-text-mid">
                Duyệt sự cố sẽ đóng ca, hủy booking và giải phóng slot. Từ chối chỉ ghi nhận quyết định, admin cần theo dõi tiếp nếu có tranh chấp.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mb-5 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label className="mb-2 block text-xs font-black uppercase tracking-wider text-text-light">Mã ca nurse bỏ ca</label>
            <input
              value={noShowWorkSessionId}
              onChange={(event) => setNoShowWorkSessionId(event.target.value)}
              placeholder="Nhập workSessionId cần xử lý"
              className="w-full rounded-xl border border-lav-100 bg-white px-4 py-3 text-sm font-bold text-text-dark outline-none focus:border-lav-300"
            />
          </div>
          <div className="flex-[1.4]">
            <label className="mb-2 block text-xs font-black uppercase tracking-wider text-text-light">Ghi chú xử lý</label>
            <input
              value={noShowNote}
              onChange={(event) => setNoShowNote(event.target.value)}
              placeholder="Ví dụ: Nurse không đến ca và không hủy trước 24 giờ"
              className="w-full rounded-xl border border-lav-100 bg-white px-4 py-3 text-sm font-bold text-text-dark outline-none focus:border-lav-300"
            />
          </div>
          <Btn variant="danger" onClick={markNurseNoShow} disabled={actionId === 'NURSE_NO_SHOW'}>
            {actionId === 'NURSE_NO_SHOW' ? <Loader2 className="animate-spin" size={16} /> : <AlertTriangle size={16} />}
            Xác nhận nurse bỏ ca
          </Btn>
        </div>
      </Card>
      <div className="grid gap-5 xl:grid-cols-[minmax(360px,0.85fr)_minmax(0,1.15fr)]">
        <Card className="p-0">
          <div className="border-b border-lav-100 px-5 py-4">
            <h2 className="text-lg font-black text-text-dark">Danh sách sự cố</h2>
          </div>

          {isLoading ? (
            <div className="flex h-[420px] items-center justify-center">
              <Loader2 className="animate-spin text-lav-dark" size={32} />
            </div>
          ) : incidents.length === 0 ? (
            <div className="p-8 text-center text-sm font-bold text-text-light">Chưa có sự cố phù hợp.</div>
          ) : (
            <div className="divide-y divide-lav-100">
              {incidents.map((incident) => {
                const selected = selectedIncident?.id === incident.id;
                return (
                  <button
                    key={incident.id}
                    type="button"
                    onClick={() => setSelectedId(incident.id)}
                    className={`block w-full px-5 py-4 text-left transition hover:bg-lav-50 ${selected ? 'bg-lav-50' : 'bg-white'}`}
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black text-text-dark">{typeLabel[incident.incidentType] ?? incident.incidentType}</div>
                        <div className="mt-1 truncate text-xs font-bold text-text-mid">{incident.reportedByName}</div>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-black ${statusClass[incident.status]}`}>
                        {statusLabel[incident.status]}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-text-light">{formatDateTime(incident.createdAt)}</div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="min-h-[560px]">
          {!selectedIncident ? (
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center text-center">
              <AlertTriangle className="mb-4 text-lav-dark opacity-25" size={54} />
              <h3 className="text-xl font-black text-text-dark">Chưa chọn sự cố</h3>
              <p className="mt-2 text-sm font-bold text-text-mid">Chọn một sự cố bên trái để kiểm tra evidence.</p>
            </div>
          ) : (
            <div>
              <div className="mb-5 flex flex-col gap-3 border-b border-lav-100 pb-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.08em] text-text-light">Chi tiết sự cố</div>
                  <h2 className="mt-1 text-2xl font-black text-text-dark">{typeLabel[selectedIncident.incidentType] ?? selectedIncident.incidentType}</h2>
                  <p className="mt-1 text-sm font-bold text-text-mid">
                    Người báo cáo: {selectedIncident.reportedByName} · {formatDateTime(selectedIncident.createdAt)}
                  </p>
                </div>
                <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${statusClass[selectedIncident.status]}`}>
                  {statusLabel[selectedIncident.status]}
                </span>
              </div>

              <div className="mb-5 rounded-xl border border-lav-100 bg-lav-50 p-4">
                <div className="mb-2 text-xs font-black uppercase text-text-light">Mô tả</div>
                <p className="whitespace-pre-wrap text-sm font-bold leading-6 text-text-dark">{selectedIncident.description}</p>
              </div>

              <section className="mb-5">
                <h3 className="mb-3 text-sm font-black text-text-dark">Bằng chứng</h3>
                {selectedIncident.evidences.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-lav-200 bg-lav-50 p-5 text-center text-sm font-bold text-text-light">
                    Chưa có bằng chứng.
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {selectedIncident.evidences.map((evidence) => (
                      <a
                        key={evidence.id}
                        href={evidence.previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="group overflow-hidden rounded-xl border border-lav-100 bg-white"
                      >
                        <div className="flex aspect-video items-center justify-center bg-lav-50 text-lav-dark">
                          {evidence.previewUrl && evidence.contentType?.startsWith('image/') ? (
                            <img src={evidence.previewUrl} alt="Incident evidence" className="h-full w-full object-cover" />
                          ) : (
                            <ImageIcon size={24} />
                          )}
                        </div>
                        <div className="flex items-center justify-between px-3 py-2 text-xs font-black text-lav-dark">
                          <span>Xem bằng chứng</span>
                          <Eye size={14} />
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </section>

              {selectedIncident.status === 'PENDING_REVIEW' ? (
                <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                  <div className="mb-3 text-sm font-black text-text-dark">Quyết định của admin</div>
                  <textarea
                    value={adminNote}
                    onChange={(event) => setAdminNote(event.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="Ghi chú nội bộ hoặc lý do xử lý..."
                    className="w-full resize-none rounded-xl border border-amber-100 bg-white px-4 py-3 text-sm font-bold text-text-dark outline-none focus:border-amber-300"
                  />
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <Btn variant="danger" disabled={Boolean(actionId)} onClick={() => reviewIncident('REJECT')}>
                      {actionId === 'REJECT' ? <Loader2 className="animate-spin" size={16} /> : <XCircle size={16} />}
                      Từ chối báo cáo
                    </Btn>
                    <Btn disabled={Boolean(actionId)} onClick={() => reviewIncident('APPROVE')}>
                      {actionId === 'APPROVE' ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                      Duyệt và đóng ca
                    </Btn>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-lav-100 bg-lav-50 p-4">
                  <div className="text-xs font-black uppercase text-text-light">Kết quả xử lý</div>
                  <div className="mt-1 text-sm font-black text-text-dark">{statusLabel[selectedIncident.status]}</div>
                  {selectedIncident.adminNote && <p className="mt-2 text-sm font-semibold text-text-mid">{selectedIncident.adminNote}</p>}
                  <div className="mt-2 text-xs font-bold text-text-light">{formatDateTime(selectedIncident.reviewedAt)}</div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminWorkSessionIncidents;
