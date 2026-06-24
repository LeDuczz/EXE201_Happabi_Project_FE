import { BadgePercent, Loader2, Save, Settings } from 'lucide-react';
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

interface FinancialConfiguration {
    payOsGatewayFeeRate: number;
    platformCommissionRate: number;
}

const AdminSystemConfig = () => {
    const [configs, setConfigs] = useState<ConfigItem[]>([]);
    const [financialConfig, setFinancialConfig] = useState<FinancialConfiguration | null>(null);
    const [payOsFeePercent, setPayOsFeePercent] = useState('0');
    const [platformCommissionPercent, setPlatformCommissionPercent] = useState('15');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const loadConfigs = async () => {
        setIsLoading(true);
        try {
            const [configsResponse, financialResponse] = await Promise.all([
                axiosClient.get('/api/v1/admin/system-configs'),
                axiosClient.get('/api/v1/admin/system-configs/financial'),
            ]);
            const nextFinancialConfig = financialResponse.data?.data as FinancialConfiguration;
            setConfigs((configsResponse.data?.data || []).filter((config: ConfigItem) => (
                config.configKey !== 'PAYOS_GATEWAY_FEE_RATE'
                && config.configKey !== 'PLATFORM_COMMISSION_RATE'
            )));
            setFinancialConfig(nextFinancialConfig);
            setPayOsFeePercent(String((Number(nextFinancialConfig?.payOsGatewayFeeRate ?? 0) * 100)));
            setPlatformCommissionPercent(String((Number(nextFinancialConfig?.platformCommissionRate ?? 0.15) * 100)));
        } catch (err: any) {
            setError(getApiErrorMessage(err, 'Không tải được cấu hình hệ thống.'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleFinancialUpdate = async () => {
        setIsSaving('financial');
        setError('');
        setSuccess('');
        try {
            const payOsGatewayFeeRate = Number(payOsFeePercent) / 100;
            const platformCommissionRate = Number(platformCommissionPercent) / 100;
            if (!Number.isFinite(payOsGatewayFeeRate) || !Number.isFinite(platformCommissionRate)
                || payOsGatewayFeeRate < 0 || platformCommissionRate < 0
                || payOsGatewayFeeRate > 1 || platformCommissionRate > 1) {
                setError('Tỷ lệ phải nằm trong khoảng từ 0% đến 100%.');
                return;
            }
            await axiosClient.put('/api/v1/admin/system-configs/financial', {
                payOsGatewayFeeRate,
                platformCommissionRate,
            });
            setSuccess('Đã cập nhật cấu hình tài chính. Chỉ đơn mới được áp dụng tỷ lệ mới.');
            await loadConfigs();
        } catch (err: any) {
            setError(getApiErrorMessage(err, 'Không thể cập nhật cấu hình tài chính.'));
        } finally {
            setIsSaving(null);
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
                    <Card className="border-lav-200 p-6">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <div className="flex items-center gap-2 font-sans text-xl font-black text-text-dark">
                                    <BadgePercent size={20} className="text-lav-acc" />
                                    Cấu hình tài chính
                                </div>
                                <div className="mt-1 text-sm font-semibold text-text-light">
                                    Tỷ lệ được snapshot khi tạo payment link hoặc booking, không ảnh hưởng đơn cũ.
                                </div>
                            </div>
                            <Btn size="sm" onClick={handleFinancialUpdate} disabled={isSaving === 'financial' || !financialConfig}>
                                {isSaving === 'financial' ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                Lưu cấu hình tài chính
                            </Btn>
                        </div>

                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                            <PercentageInput
                                label="Phí cổng PayOS"
                                helper="Happabi chịu phí này. Áp dụng khi tạo payment link mới."
                                value={payOsFeePercent}
                                onChange={setPayOsFeePercent}
                            />
                            <PercentageInput
                                label="Tỷ lệ Happabi giữ lại"
                                helper="Phần còn lại được phân bổ cho nurse khi booking hoàn tất."
                                value={platformCommissionPercent}
                                onChange={setPlatformCommissionPercent}
                            />
                        </div>
                    </Card>

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

const PercentageInput = ({ label, helper, value, onChange }: {
    label: string;
    helper: string;
    value: string;
    onChange: (value: string) => void;
}) => (
    <label className="block rounded-xl border border-lav-100 bg-lav-50/30 p-4">
        <span className="block text-sm font-black text-text-dark">{label}</span>
        <span className="mt-1 block text-xs font-semibold leading-5 text-text-light">{helper}</span>
        <div className="mt-3 flex items-center rounded-xl border border-lav-200 bg-white px-3 focus-within:border-lav-acc">
            <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="w-full bg-transparent py-2 text-lg font-black text-text-dark outline-none"
            />
            <span className="text-sm font-black text-text-mid">%</span>
        </div>
    </label>
);

const ConfigCard = ({ config, onSave, isSaving }: { config: ConfigItem, onSave: (k: string, v: string) => void, isSaving: boolean }) => {
    const [val, setVal] = useState(config.configValue);

    return (
        <Card className="p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="flex-1">
                    <div className="text-lg font-semibold text-text-dark">{config.configKey}</div>
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
