import { Activity, Clock, Loader2, Shield, User as UserIcon, Search, X, Info, ExternalLink } from 'lucide-react';
import { useEffect, useState, useCallback, useRef } from 'react';
import axiosClient from '../../api/axiosClient';
import Card from '../../components/common/Card';
import Topbar from '../../components/layout/Topbar';
import Input from '../../components/common/Input';
import Pagination from '../../components/common/Pagination';
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

const AuditLogs = () => {
    const [logs, setLogs] = useState<AuditEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLog, setSelectedLog] = useState<AuditEvent | null>(null);

    // Pagination state
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const pageSize = 20;

    const loadLogs = useCallback(async (search?: string, pageNumber = 0) => {
        setIsLoading(true);
        try {
            let url = `/api/v1/admin/audit-logs?page=${pageNumber}&size=${pageSize}`;
            if (search) {
                url += `&query=${encodeURIComponent(search)}`;
            }
            const response = await axiosClient.get(url);
            const data = response.data?.data;
            setLogs(data?.content || []);
            setTotalPages(data?.totalPages || 0);
            setTotalElements(data?.totalElements || 0);
        } catch (err: any) {
            setError(getApiErrorMessage(err, 'Không tải được nhật ký hệ thống.'));
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Debounce search using window.setTimeout for broad compatibility
    const searchTimeoutRef = useRef<any>(null);
    useEffect(() => {
        if (searchTimeoutRef.current) window.clearTimeout(searchTimeoutRef.current);

        searchTimeoutRef.current = window.setTimeout(() => {
            setPage(0);
            void loadLogs(searchTerm, 0);
        }, 400);

        return () => {
            if (searchTimeoutRef.current) window.clearTimeout(searchTimeoutRef.current);
        };
    }, [searchTerm, loadLogs]);

    const onPageChange = (newPage: number) => {
        setPage(newPage);
        void loadLogs(searchTerm, newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <>
            <Topbar title="Nhật ký hệ thống" subtitle="Theo dõi toàn bộ các thao tác quản trị và thay đổi quan trọng trên hệ thống (Sử dụng Elasticsearch)." />

            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="w-full max-w-md">
                    <Input
                        placeholder="Tìm theo hành động, actor, resource ID, IP..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        icon={<Search size={18} />}
                    />
                </div>
                <div className="text-sm font-bold text-text-light">
                    Tổng số: <span className="text-lav-dark">{totalElements}</span> sự kiện
                </div>
            </div>

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
                                className="p-4 hover:shadow-md transition-all cursor-pointer group hover:bg-lav-50/20"
                                onClick={() => setSelectedLog(log)}
                            >
                                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-lav-50 text-lav-dark shadow-sm">
                                        <Activity size={24} />
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-lav-dark bg-lav-100 px-2 py-0.5 rounded-md">
                                                {log.action}
                                            </span>
                                            <span className="text-[10px] font-black uppercase tracking-wider text-text-mid opacity-50">
                                                Target: {log.targetResourceType} ({log.targetResourceId?.slice(0, 8)})
                                            </span>
                                        </div>
                                        <div className="mt-1 font-black text-text-dark flex items-center gap-2">
                                            <UserIcon size={14} className="text-text-light" /> {log.actorId || 'System'}
                                            <span className="text-xs font-bold text-text-light">({log.actorRole || 'N/A'})</span>
                                        </div>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-6">
                                        <div className="text-right">
                                            <div className="flex items-center justify-end gap-1 text-xs font-bold text-text-mid">
                                                <Clock size={12} /> {new Date(log.createdAt).toLocaleString('vi-VN')}
                                            </div>
                                            <div className="mt-1 text-[10px] font-semibold text-text-light uppercase tracking-widest">{log.ipAddress}</div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className={`rounded-full px-3 py-1 text-[10px] font-black ${log.status === 'SUCCESS' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                                {log.status}
                                            </div>
                                            <ExternalLink size={16} className="text-text-light opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {!logs.length && (
                        <Card className="p-20 text-center shadow-inner bg-lav-50/10 border-dashed border-2 border-lav-100">
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

            {/* Detail Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-text-dark/40 p-4 backdrop-blur-sm transition-all animate-in fade-in">
                    <Card className="max-h-[80vh] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-lav-100 bg-lav-50/50 p-4">
                            <div className="flex items-center gap-2">
                                <Info className="text-lav-dark" size={20} />
                                <h3 className="font-black text-text-dark uppercase tracking-tight">Chi tiết Audit Event</h3>
                            </div>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="rounded-full p-1 hover:bg-lav-100 text-text-mid transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="overflow-y-auto p-6">
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="space-y-1">
                                    <div className="text-[10px] font-black text-text-light uppercase tracking-widest">Hành động</div>
                                    <div className="font-black text-lav-dark">{selectedLog.action}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[10px] font-black text-text-light uppercase tracking-widest">Trạng thái</div>
                                    <div className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-black ${selectedLog.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {selectedLog.status}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[10px] font-black text-text-light uppercase tracking-widest">Người thực hiện</div>
                                    <div className="font-bold text-text-dark">{selectedLog.actorId} ({selectedLog.actorRole})</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[10px] font-black text-text-light uppercase tracking-widest">IP Address</div>
                                    <div className="font-bold text-text-dark">{selectedLog.ipAddress}</div>
                                </div>
                            </div>

                            {selectedLog.reason && (
                                <div className="mb-6 rounded-xl bg-red-50 p-4 ring-1 ring-red-100">
                                    <div className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Lý do thất bại</div>
                                    <div className="text-sm font-bold text-red-700">{selectedLog.reason}</div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <div className="text-[10px] font-black text-text-light uppercase tracking-widest">Metadata (JSON)</div>
                                <div className="rounded-2xl bg-text-dark p-4 font-mono text-xs text-white overflow-x-auto shadow-inner">
                                    <pre>{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
                                </div>
                            </div>
                        </div>
                        <div className="border-t border-lav-100 bg-lav-50/50 p-4 text-center">
                            <div className="text-[10px] font-bold text-text-light uppercase tracking-widest">
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
