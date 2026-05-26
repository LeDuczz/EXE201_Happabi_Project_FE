import { Loader2, Save, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import Btn from '../../components/common/Btn';
import Card from '../../components/common/Card';
import Topbar from '../../components/layout/Topbar';
import { getApiErrorMessage } from '../../utils/apiError';

interface ConfigItem {
    configKey: string;
    configValue: string;
    description: string;
    updatedAt: string;
}

const AdminSystemConfig = () => {
    const [configs, setConfigs] = useState<ConfigItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const loadConfigs = async () => {
        setIsLoading(true);
        try {
            const response = await axiosClient.get('/api/v1/admin/system-configs');
            setConfigs(response.data?.data || []);
        } catch (err: any) {
            setError(getApiErrorMessage(err, 'Không tải được cấu hình hệ thống.'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadConfigs();
    }, []);

    const handleUpdate = async (key: string, value: string) => {
        setIsSaving(key);
        setError('');
        setSuccess('');
        try {
            await axiosClient.post(`/api/v1/admin/system-configs/${key}`, { value });
            setSuccess(`Đã cập nhật ${key} thành công.`);
            await loadConfigs();
        } catch (err: any) {
            setError(getApiErrorMessage(err));
        } finally {
            setIsSaving(null);
        }
    };

    return (
        <>
            <Topbar title="Cấu hình hệ thống" subtitle="Quản lý các tham số vận hành, tỷ lệ hoa hồng và thiết lập nền tảng." />

            {(error || success) && (
                <div className={`mb-5 flex items-center gap-2 rounded-2xl border p-4 text-sm font-bold ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>
                    <span>{error || success}</span>
                </div>
            )}

            {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="animate-spin text-lav-dark" />
                </div>
            ) : (
                <div className="grid gap-6">
                    {configs.map((config) => (
                        <ConfigCard
                            key={config.configKey}
                            config={config}
                            onSave={handleUpdate}
                            isSaving={isSaving === config.configKey}
                        />
                    ))}
                    {!configs.length && (
                        <Card className="p-10 text-center">
                            <Settings className="mx-auto mb-3 text-lav-100" size={40} />
                            <div className="font-bold text-text-light">Không có cấu hình nào được tìm thấy trong database.</div>
                        </Card>
                    )}
                </div>
            )}
        </>
    );
};

const ConfigCard = ({ config, onSave, isSaving }: { config: ConfigItem, onSave: (k: string, v: string) => void, isSaving: boolean }) => {
    const [val, setVal] = useState(config.configValue);

    return (
        <Card className="p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="flex-1">
                    <div className="text-lg font-black text-text-dark">{config.configKey}</div>
                    <div className="mt-1 text-sm font-semibold text-text-light">{config.description || 'Không có mô tả.'}</div>
                    <div className="mt-2 text-[10px] uppercase tracking-wider text-text-mid opacity-50">Cập nhật lần cuối: {new Date(config.updatedAt).toLocaleString('vi-VN')}</div>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="text"
                        value={val}
                        onChange={(e) => setVal(e.target.value)}
                        className="w-40 rounded-xl border border-lav-200 bg-white px-4 py-2 text-sm font-bold text-text-dark outline-none focus:border-lav-acc"
                    />
                    <Btn size="sm" onClick={() => onSave(config.configKey, val)} disabled={isSaving || val === config.configValue}>
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Lưu
                    </Btn>
                </div>
            </div>
        </Card>
    );
};

export default AdminSystemConfig;
