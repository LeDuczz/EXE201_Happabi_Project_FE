import {
    Activity,
    CalendarDays,
    Clock,
    ExternalLink,
    Info,
    Loader2,
    Search,
    Shield,
    User as UserIcon,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import Card from '../../components/common/Card';
import Pagination from '../../components/common/Pagination';
import Topbar from '../../components/layout/Topbar';
import { getApiErrorMessage } from '../../utils/apiError';

interface AuditEvent {
    id: string;
    actorId: string;
    actorRole: string;
    action: string;
    targetResourceType: string;
    targetResourceId: string;
    status: string;
    ipAddress: string;
    createdAt: string;
    metadata: Record<string, any>;
    reason?: string;
}

const pageSize = 20;

const formatDateInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const daysAgo = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return formatDateInput(date);
};

const today = () => formatDateInput(new Date());

const AuditLogs = () => {
    const [logs, setLogs] = useState<AuditEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [fromDate, setFromDate] = useState(daysAgo(30));
    const [toDate, setToDate] = useState(today());
    const [selectedLog, setSelectedLog] = useState<AuditEvent | null>(null);

    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    const queryParams = useMemo(() => {
        const params = new URLSearchParams({
            page: String(page),
            size: String(pageSize),
        });

        if (debouncedSearchTerm.trim()) {
            params.set('query', debouncedSearchTerm.trim());
        }
        if (fromDate) {
            params.set('fromDate', fromDate);
        }
        if (toDate) {
            params.set('toDate', toDate);
        }

        return params.toString();
    }, [debouncedSearchTerm, fromDate, page, toDate]);

    const loadLogs = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await axiosClient.get(`/api/v1/admin/audit-logs?${queryParams}`);
            const data = response.data?.data;
            setLogs(data?.content || []);
            setTotalPages(data?.totalPages || 0);
            setTotalElements(data?.totalElements || 0);
        } catch (err: any) {
            setError(getApiErrorMessage(err, 'Không tải được nhật ký hệ thống.'));
        } finally {
            setIsLoading(false);
        }
    }, [queryParams]);

    const loadSuggestions = useCallback(async (query: string) => {
        try {
            const params = new URLSearchParams();
            if (query.trim()) {
                params.set('query', query.trim());
            }
            const response = await axiosClient.get(`/api/v1/admin/audit-logs/suggestions?${params.toString()}`);
            setSuggestions(response.data?.data || []);
        } catch {
            setSuggestions([]);
        }
    }, []);

    const searchTimeoutRef = useRef<number | null>(null);
    useEffect(() => {
        if (searchTimeoutRef.current) window.clearTimeout(searchTimeoutRef.current);

        searchTimeoutRef.current = window.setTimeout(() => {
            setPage(0);
            setDebouncedSearchTerm(searchTerm);
            void loadSuggestions(searchTerm);
        }, 300);

        return () => {
            if (searchTimeoutRef.current) window.clearTimeout(searchTimeoutRef.current);
        };
    }, [loadSuggestions, searchTerm]);

    useEffect(() => {
        void loadLogs();
    }, [loadLogs]);

    const clearFilters = () => {
        setSearchTerm('');
        setDebouncedSearchTerm('');
        setFromDate(daysAgo(30));
        setToDate(today());
        setPage(0);
    };

    const onPageChange = (newPage: number) => {
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <>
            <Topbar
                title="Nhật ký hệ thống"
                subtitle="Theo dõi thao tác quản trị và thay đổi quan trọng từ Elasticsearch."
            />

            <Card className="mb-6 p-4">
                <div className="grid gap-4 xl:grid-cols-[minmax(320px,1fr)_auto] xl:items-end">
                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-text-light">
                            Tìm kiếm audit
                        </label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light" size={18} />
                            <input
                                list="audit-search-suggestions"
                                placeholder="Hành động, actor, resource ID, IP..."
                                value={searchTerm}
                                onChange={(event) => {
                                    setSearchTerm(event.target.value);
                                    setPage(0);
                                }}
                                className="h-12 w-full rounded-xl border border-lav-200 bg-white pl-11 pr-4 text-sm font-semibold text-text-dark outline-none transition focus:border-lav-acc focus:ring-4 focus:ring-lav-100"
                            />
                            <datalist id="audit-search-suggestions">
                                {suggestions.map((suggestion) => (
                                    <option key={suggestion} value={suggestion} />
                                ))}
                            </datalist>
                        </div>
                        {suggestions.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {suggestions.slice(0, 6).map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        type="button"
                                        onClick={() => {
                                            setSearchTerm(suggestion);
                                            setDebouncedSearchTerm(suggestion);
                                            setPage(0);
                                        }}
                                        className="rounded-full border border-lav-200 bg-lav-50 px-3 py-1 text-xs font-bold text-lav-dark transition hover:border-lav-acc hover:bg-white"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid gap-3 md:grid-cols-[auto_auto] md:items-end">

                        <div className="grid grid-cols-2 gap-2">
                            <label className="block">
                                <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-text-light">
                                    Từ ngày
                                </span>
                                <input
                                    type="date"
                                    value={fromDate}
                                    max={toDate || undefined}
                                    onChange={(event) => {
                                        setFromDate(event.target.value);
                                        setPage(0);
                                    }}
                                    className="h-11 rounded-xl border border-lav-200 bg-white px-3 text-sm font-bold text-text-dark outline-none focus:border-lav-acc focus:ring-4 focus:ring-lav-100"
                                />
                            </label>
                            <label className="block">
                                <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-text-light">
                                    Đến ngày
                                </span>
                                <input
                                    type="date"
                                    value={toDate}
                                    min={fromDate || undefined}
                                    onChange={(event) => {
                                        setToDate(event.target.value);
                                        setPage(0);
                                    }}
                                    className="h-11 rounded-xl border border-lav-200 bg-white px-3 text-sm font-bold text-text-dark outline-none focus:border-lav-acc focus:ring-4 focus:ring-lav-100"
                                />
                            </label>
                        </div>

                        <div className="flex items-center justify-between gap-3 md:justify-end">
                            <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-text-light ring-1 ring-lav-100">
                                <CalendarDays size={16} className="text-lav-dark" />
                                <span>
                                    Tổng: <span className="text-lav-dark">{totalElements}</span>
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="h-11 rounded-xl border border-lav-200 bg-white px-4 text-sm font-bold text-lav-dark transition hover:border-lav-acc hover:bg-lav-50"
                            >
                                Xóa lọc
                            </button>
                        </div>
                    </div>
                </div>
            </Card>

            {isLoading && page === 0 ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="animate-spin text-lav-dark" size={32} />
                </div>
            ) : error ? (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center font-bold text-red-600">
                    {error}
                </div>
            ) : (
                <div className="flex flex-col gap-4 pb-12">
                    <div className="grid gap-4">
                        {logs.map((log) => (
                            <Card
                                key={log.id}
                                className="cursor-pointer p-4 transition-all hover:bg-lav-50/20 hover:shadow-md group"
                                onClick={() => setSelectedLog(log)}
                            >
                                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-lav-50 text-lav-dark shadow-sm">
                                        <Activity size={24} />
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="rounded-md bg-lav-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-lav-dark">
                                                {log.action}
                                            </span>
                                            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-mid opacity-60">
                                                Target: {log.targetResourceType} ({log.targetResourceId?.slice(0, 8)})
                                            </span>
                                        </div>
                                        <div className="mt-1 flex items-center gap-2 font-semibold text-text-dark">
                                            <UserIcon size={14} className="text-text-light" /> {log.actorId || 'System'}
                                            <span className="text-xs font-bold text-text-light">({log.actorRole || 'N/A'})</span>
                                        </div>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-6">
                                        <div className="text-right">
                                            <div className="flex items-center justify-end gap-1 text-xs font-bold text-text-mid">
                                                <Clock size={12} /> {new Date(log.createdAt).toLocaleString('vi-VN')}
                                            </div>
                                            <div className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-text-light">
                                                {log.ipAddress}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className={`rounded-full px-3 py-1 text-[10px] font-semibold ${log.status === 'SUCCESS' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                                {log.status}
                                            </div>
                                            <ExternalLink size={16} className="text-text-light opacity-0 transition-opacity group-hover:opacity-100" />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {!logs.length && (
                        <Card className="border-2 border-dashed border-lav-100 bg-lav-50/10 p-20 text-center shadow-inner">
                            <Shield size={40} className="mx-auto mb-4 text-lav-200" />
                            <div className="text-sm font-bold text-text-light">Không tìm thấy kết quả phù hợp.</div>
                        </Card>
                    )}

                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={onPageChange}
                        isLoading={isLoading}
                    />
                </div>
            )}

            {selectedLog && (
                <div className="fixed inset-0 z-50 flex animate-in fade-in items-center justify-center bg-text-dark/40 p-4 backdrop-blur-sm">
                    <Card className="max-h-[80vh] w-full max-w-2xl animate-in overflow-hidden shadow-2xl zoom-in-95">
                        <div className="flex items-center justify-between border-b border-lav-100 bg-lav-50/50 p-4">
                            <div className="flex items-center gap-2">
                                <Info className="text-lav-dark" size={20} />
                                <h3 className="font-semibold uppercase tracking-tight text-text-dark">Chi tiết Audit Event</h3>
                            </div>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="rounded-full p-1 text-text-mid transition-colors hover:bg-lav-100"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="overflow-y-auto p-6">
                            <div className="mb-6 grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <div className="text-[10px] font-semibold uppercase tracking-widest text-text-light">Hành động</div>
                                    <div className="font-semibold text-lav-dark">{selectedLog.action}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[10px] font-semibold uppercase tracking-widest text-text-light">Trạng thái</div>
                                    <div className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${selectedLog.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {selectedLog.status}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[10px] font-semibold uppercase tracking-widest text-text-light">Người thực hiện</div>
                                    <div className="font-bold text-text-dark">{selectedLog.actorId} ({selectedLog.actorRole})</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[10px] font-semibold uppercase tracking-widest text-text-light">IP Address</div>
                                    <div className="font-bold text-text-dark">{selectedLog.ipAddress}</div>
                                </div>
                            </div>

                            {selectedLog.reason && (
                                <div className="mb-6 rounded-xl bg-red-50 p-4 ring-1 ring-red-100">
                                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-red-600">Lý do thất bại</div>
                                    <div className="text-sm font-bold text-red-700">{selectedLog.reason}</div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <div className="text-[10px] font-semibold uppercase tracking-widest text-text-light">Metadata (JSON)</div>
                                <div className="overflow-x-auto rounded-2xl bg-text-dark p-4 font-mono text-xs text-white shadow-inner">
                                    <pre>{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
                                </div>
                            </div>
                        </div>
                        <div className="border-t border-lav-100 bg-lav-50/50 p-4 text-center">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-text-light">
                                Event ID: {selectedLog.id}
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </>
    );
};

export default AuditLogs;
