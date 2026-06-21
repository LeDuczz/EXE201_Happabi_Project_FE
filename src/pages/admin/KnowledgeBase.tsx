import {
  BookOpenCheck,
  CheckCircle2,
  DatabaseZap,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  aiKnowledgeApi,
  type KnowledgeItem,
  type KnowledgeStatus,
  type UpsertKnowledgeChunkPayload,
} from '../../api/aiKnowledgeApi';
import Btn from '../../components/common/Btn';
import Card from '../../components/common/Card';
import Topbar from '../../components/layout/Topbar';
import { getApiErrorMessage } from '../../utils/apiError';

type KnowledgeFilter = KnowledgeStatus | 'ALL';

const statusLabel: Record<KnowledgeFilter, string> = {
  ALL: 'Tất cả',
  PENDING_REVIEW: 'Chờ duyệt',
  VERIFIED: 'Đã duyệt',
  REJECTED: 'Đã từ chối',
};

const statusClass: Record<KnowledgeStatus, string> = {
  PENDING_REVIEW: 'border-amber-200 bg-amber-50 text-amber-700',
  VERIFIED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  REJECTED: 'border-rose-200 bg-rose-50 text-rose-700',
};

const emptyForm: UpsertKnowledgeChunkPayload = {
  title: '',
  question: '',
  answer: '',
  content: '',
  sourceType: 'ADMIN',
  sourceId: '',
  language: 'vi',
  verified: false,
};

const formatDateTime = (value?: string) => {
  if (!value) return '--';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
};

const AdminKnowledgeBase = () => {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [activeStatus, setActiveStatus] = useState<KnowledgeFilter>('PENDING_REVIEW');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [form, setForm] = useState<UpsertKnowledgeChunkPayload>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadItems = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await aiKnowledgeApi.getItems('ALL');
      setItems(data);
      setSelectedId((current) => current && data.some((item) => item.id === current) ? current : data[0]?.id ?? null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không tải được danh sách tri thức AI.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, []);

  const filteredItems = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return items.filter((item) => {
      const matchesStatus = activeStatus === 'ALL' || item.status === activeStatus;
      const matchesKeyword = !normalizedKeyword ||
        item.title.toLowerCase().includes(normalizedKeyword) ||
        item.question.toLowerCase().includes(normalizedKeyword) ||
        item.answer.toLowerCase().includes(normalizedKeyword);
      return matchesStatus && matchesKeyword;
    });
  }, [activeStatus, items, keyword]);

  const selectedItem = useMemo(
    () => filteredItems.find((item) => item.id === selectedId) ?? filteredItems[0] ?? null,
    [filteredItems, selectedId],
  );

  const statusCounts = useMemo(() => ({
    PENDING_REVIEW: items.filter((item) => item.status === 'PENDING_REVIEW').length,
    VERIFIED: items.filter((item) => item.status === 'VERIFIED').length,
    REJECTED: items.filter((item) => item.status === 'REJECTED').length,
  }), [items]);

  const createKnowledge = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');
    try {
      await aiKnowledgeApi.createChunk({
        ...form,
        title: form.title.trim(),
        question: form.question.trim(),
        answer: form.answer.trim(),
        content: form.content.trim(),
        sourceType: form.sourceType?.trim() || 'ADMIN',
        sourceId: form.sourceId?.trim() || undefined,
        language: form.language?.trim() || 'vi',
      });
      setForm(emptyForm);
      setSuccess(form.verified ? 'Đã thêm và index tri thức AI.' : 'Đã thêm tri thức AI vào hàng đợi duyệt.');
      await loadItems();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không tạo được tri thức AI.'));
    } finally {
      setIsSaving(false);
    }
  };

  const reviewSelected = async (approved: boolean) => {
    if (!selectedItem) return;
    setIsProcessing(true);
    setError('');
    setSuccess('');
    try {
      await aiKnowledgeApi.reviewItem(selectedItem.id, approved);
      setSuccess(approved ? 'Đã duyệt và index tri thức AI.' : 'Đã từ chối tri thức AI.');
      await loadItems();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không cập nhật được trạng thái tri thức AI.'));
    } finally {
      setIsProcessing(false);
    }
  };

  const reindexSelected = async () => {
    if (!selectedItem) return;
    setIsProcessing(true);
    setError('');
    setSuccess('');
    try {
      await aiKnowledgeApi.reindexItem(selectedItem.id);
      setSuccess('Đã reindex tri thức AI.');
      await loadItems();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không reindex được tri thức AI.'));
    } finally {
      setIsProcessing(false);
    }
  };

  const reindexAll = async () => {
    setIsProcessing(true);
    setError('');
    setSuccess('');
    try {
      const result = await aiKnowledgeApi.reindexVerifiedItems();
      setSuccess(`Đã reindex ${result.length} tri thức đã duyệt chưa indexed.`);
      await loadItems();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không reindex được danh sách tri thức AI.'));
    } finally {
      setIsProcessing(false);
    }
  };

  const canCreate = form.title.trim() && form.question.trim() && form.answer.trim() && form.content.trim();

  return (
    <div className="pb-10">
      <Topbar
        title="AI Knowledge Base"
        subtitle="Duyệt, index và quản lý tri thức mà chatbot được phép sử dụng để trả lời người dùng."
      />

      {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}
      {success && <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{success}</div>}

      <div className="mb-5 grid gap-4 lg:grid-cols-4">
        <SummaryCard label="Chờ duyệt" value={statusCounts.PENDING_REVIEW} tone="amber" />
        <SummaryCard label="Đã duyệt" value={statusCounts.VERIFIED} tone="green" />
        <SummaryCard label="Đã từ chối" value={statusCounts.REJECTED} tone="rose" />
        <Card className="p-4">
          <Btn variant="soft" size="sm" onClick={reindexAll} disabled={isProcessing}>
            {isProcessing ? <Loader2 size={15} className="animate-spin" /> : <DatabaseZap size={15} />}
            Reindex verified
          </Btn>
          <div className="mt-2 text-xs font-bold text-text-light">Chỉ xử lý item đã duyệt nhưng chưa indexed.</div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(360px,0.9fr)_minmax(0,1.1fr)]">
        <Card className="p-0">
          <div className="border-b border-lav-100 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BookOpenCheck size={20} className="text-lav-dark" />
                <h2 className="text-lg font-black text-text-dark">Danh sách tri thức</h2>
              </div>
              <button onClick={loadItems} className="text-lav-dark" aria-label="Làm mới tri thức">
                <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {(['PENDING_REVIEW', 'VERIFIED', 'REJECTED', 'ALL'] as KnowledgeFilter[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setActiveStatus(status)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-black transition ${
                    activeStatus === status
                      ? 'bg-lav-acc text-white shadow-[0_8px_22px_rgba(192,132,252,.25)]'
                      : 'bg-white text-lav-dark ring-1 ring-lav-200 hover:bg-lav-50'
                  }`}
                >
                  {statusLabel[status]}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-lav-100 bg-white px-3 py-2">
              <Search size={16} className="text-text-light" />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Tìm theo tiêu đề, câu hỏi, câu trả lời..."
                className="min-w-0 flex-1 bg-transparent text-sm font-bold text-text-dark outline-none"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex h-[480px] items-center justify-center">
              <Loader2 className="animate-spin text-lav-dark" size={32} />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-8 text-center text-sm font-bold text-text-light">Chưa có tri thức phù hợp.</div>
          ) : (
            <div className="max-h-[640px] divide-y divide-lav-100 overflow-y-auto">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`block w-full px-5 py-4 text-left transition hover:bg-lav-50 ${selectedItem?.id === item.id ? 'bg-lav-50' : 'bg-white'}`}
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-black text-text-dark">{item.title}</div>
                      <div className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-text-mid">{item.question}</div>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-black ${statusClass[item.status]}`}>
                      {statusLabel[item.status]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-xs font-bold text-text-light">
                    <span>{formatDateTime(item.updatedAt)}</span>
                    <span>{item.vectorIndexed ? 'Indexed' : 'Chưa indexed'}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>

        <div className="space-y-5">
          <Card className="p-6">
            {!selectedItem ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
                <BookOpenCheck className="mb-4 text-lav-dark opacity-25" size={54} />
                <h3 className="text-xl font-black text-text-dark">Chưa chọn tri thức</h3>
                <p className="mt-2 text-sm font-bold text-text-mid">Chọn một item bên trái để duyệt hoặc reindex.</p>
              </div>
            ) : (
              <div>
                <div className="mb-5 flex flex-col gap-3 border-b border-lav-100 pb-5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.08em] text-text-light">Chi tiết tri thức AI</div>
                    <h2 className="mt-1 text-2xl font-black text-text-dark">{selectedItem.title}</h2>
                    <p className="mt-1 text-sm font-bold text-text-mid">
                      {selectedItem.sourceType || 'UNKNOWN'} · {selectedItem.language || 'vi'} · {formatDateTime(selectedItem.updatedAt)}
                    </p>
                  </div>
                  <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${statusClass[selectedItem.status]}`}>
                    {statusLabel[selectedItem.status]}
                  </span>
                </div>

                <KnowledgeBlock label="Câu hỏi" value={selectedItem.question} />
                <KnowledgeBlock label="Câu trả lời" value={selectedItem.answer} />
                <KnowledgeBlock label="Ngữ cảnh" value={selectedItem.context || '--'} />

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <Btn disabled={isProcessing || selectedItem.status !== 'PENDING_REVIEW'} onClick={() => reviewSelected(true)}>
                    <CheckCircle2 size={16} />
                    Duyệt
                  </Btn>
                  <Btn variant="danger" disabled={isProcessing || selectedItem.status !== 'PENDING_REVIEW'} onClick={() => reviewSelected(false)}>
                    <XCircle size={16} />
                    Từ chối
                  </Btn>
                  <Btn variant="soft" disabled={isProcessing || selectedItem.status !== 'VERIFIED'} onClick={reindexSelected}>
                    <DatabaseZap size={16} />
                    Reindex
                  </Btn>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="mb-5 flex items-center gap-2">
              <Plus size={20} className="text-lav-dark" />
              <h2 className="text-lg font-black text-text-dark">Thêm tri thức thủ công</h2>
            </div>

            <div className="grid gap-3">
              <TextField label="Tiêu đề" value={form.title} onChange={(value) => setForm((current) => ({ ...current, title: value }))} />
              <TextArea label="Câu hỏi" rows={3} value={form.question} onChange={(value) => setForm((current) => ({ ...current, question: value }))} />
              <TextArea label="Câu trả lời chuẩn" rows={5} value={form.answer} onChange={(value) => setForm((current) => ({ ...current, answer: value }))} />
              <TextArea label="Nội dung dùng để index" rows={4} value={form.content} onChange={(value) => setForm((current) => ({ ...current, content: value }))} />

              <div className="grid gap-3 sm:grid-cols-3">
                <TextField label="Source type" value={form.sourceType ?? ''} onChange={(value) => setForm((current) => ({ ...current, sourceType: value }))} />
                <TextField label="Source ID" value={form.sourceId ?? ''} onChange={(value) => setForm((current) => ({ ...current, sourceId: value }))} />
                <TextField label="Ngôn ngữ" value={form.language ?? 'vi'} onChange={(value) => setForm((current) => ({ ...current, language: value }))} />
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-lav-100 bg-lav-50 px-4 py-3 text-sm font-bold text-text-dark">
                <input
                  type="checkbox"
                  checked={Boolean(form.verified)}
                  onChange={(event) => setForm((current) => ({ ...current, verified: event.target.checked }))}
                  className="h-4 w-4 accent-lav-acc"
                />
                Duyệt và index ngay sau khi tạo
              </label>

              <div className="flex justify-end">
                <Btn disabled={isSaving || !canCreate} onClick={createKnowledge}>
                  {isSaving ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
                  Lưu tri thức
                </Btn>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ label, value, tone }: { label: string; value: number; tone: 'amber' | 'green' | 'rose' }) => {
  const toneClass = {
    amber: 'bg-amber-50 text-amber-700',
    green: 'bg-emerald-50 text-emerald-700',
    rose: 'bg-rose-50 text-rose-700',
  }[tone];

  return (
    <Card className="p-4">
      <div className="text-xs font-black uppercase tracking-wider text-text-light">{label}</div>
      <div className={`mt-2 inline-flex rounded-2xl px-4 py-2 text-2xl font-black ${toneClass}`}>{value}</div>
    </Card>
  );
};

const KnowledgeBlock = ({ label, value }: { label: string; value: string }) => (
  <div className="mb-4 rounded-2xl border border-lav-100 bg-white p-4">
    <div className="mb-2 text-xs font-black uppercase tracking-wider text-text-light">{label}</div>
    <p className="whitespace-pre-wrap text-sm font-bold leading-6 text-text-dark">{value}</p>
  </div>
);

const TextField = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => (
  <label className="block">
    <span className="mb-1 block text-xs font-black uppercase tracking-wider text-text-light">{label}</span>
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-xl border border-lav-100 bg-white px-4 py-3 text-sm font-bold text-text-dark outline-none focus:border-lav-300"
    />
  </label>
);

const TextArea = ({
  label,
  value,
  rows,
  onChange,
}: {
  label: string;
  value: string;
  rows: number;
  onChange: (value: string) => void;
}) => (
  <label className="block">
    <span className="mb-1 block text-xs font-black uppercase tracking-wider text-text-light">{label}</span>
    <textarea
      rows={rows}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full resize-none rounded-xl border border-lav-100 bg-white px-4 py-3 text-sm font-bold leading-6 text-text-dark outline-none focus:border-lav-300"
    />
  </label>
);

export default AdminKnowledgeBase;
