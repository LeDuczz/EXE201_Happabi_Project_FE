import { useState, useEffect } from 'react';
import { CheckCircle2, ShieldCheck, Camera, Sparkles, Send } from 'lucide-react';
import Card from '../../components/common/Card';
import Btn from '../../components/common/Btn';
import Topbar from '../../components/layout/Topbar';
import checklistService, { type ChecklistItem } from '../../api/checklistService';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
void checklistService;

const Checklist = () => {
    const [items, setItems] = useState<ChecklistItem[]>([]);
    const [notes, setNotes] = useState('');
    const [, setIsSubmitting] = useState(false);

    const MOCK_ITEMS: ChecklistItem[] = [
        { id: '1', task: 'Rửa tay sát khuẩn đúng quy trình 6 bước', completed: true, category: 'PRE_PROCEDURE' },
        { id: '2', task: 'Đeo khẩu trang và trang phục bảo hộ', completed: true, category: 'PRE_PROCEDURE' },
        { id: '3', task: 'Kiểm tra nhiệt độ và dấu hiệu sinh tồn của bé', completed: false, category: 'PROCEDURE' },
        { id: '4', task: 'Tắm bé và chăm sóc rốn theo kỹ thuật y khoa', completed: false, category: 'PROCEDURE' },
        { id: '5', task: 'Kiểm tra sức khỏe vết mổ/tầng sinh môn của mẹ', completed: false, category: 'PROCEDURE' },
        { id: '6', task: 'Vệ sinh khu vực chăm sóc và thu gom rác thải y tế', completed: false, category: 'POST_PROCEDURE' },
        { id: '7', task: 'Ghi sổ theo dõi và hướng dẫn mẹ chăm sóc tại nhà', completed: false, category: 'POST_PROCEDURE' },
    ];

    useEffect(() => {
        // In real flow, we'd pass active booking ID
        setItems(MOCK_ITEMS);
    }, []);

    const toggleItem = (id: string) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, completed: !item.completed } : item
        ));
    };

    const completionRate = Math.round((items.filter(i => i.completed).length / items.length) * 100);

    return (
        <div className="pb-10">
            <Topbar
                title="AI Medical Checklist"
                subtitle="Quy trình chăm sóc chuẩn y khoa được AI giám sát và hỗ trợ."
            />

            <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
                <div className="space-y-6">
                    {/* Categories */}
                    {(['PRE_PROCEDURE', 'PROCEDURE', 'POST_PROCEDURE'] as const).map((cat) => (
                        <div key={cat}>
                            <h3 className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[2px] text-black">
                                {cat === 'PRE_PROCEDURE' ? 'Chuẩn bị (Pre-procedure)' :
                                    cat === 'PROCEDURE' ? 'Thực hiện (Procedure)' : 'Kết thúc (Post-procedure)'}
                            </h3>
                            <div className="space-y-3">
                                {items.filter(i => i.category === cat).map(item => (
                                    <div
                                        key={item.id}
                                        onClick={() => toggleItem(item.id)}
                                        className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition-all ${item.completed
                                            ? 'border-green-500/20 bg-green-500/5'
                                            : 'border-lav-100 bg-white hover:bg-lav-50'
                                            }`}
                                    >
                                        <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${item.completed ? 'border-green-500 bg-green-500 text-white' : 'border-lav-200'
                                            }`}>
                                            {item.completed && <CheckCircle2 size={14} />}
                                        </div>
                                        <span className={`text-sm font-bold ${item.completed ? 'text-green-600/50 line-through' : 'text-text-dark'}`}>
                                            {item.task}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="space-y-6">
                    {/* Status Board */}
                    <Card className="border-none bg-dark-100 p-6 text-white shadow-lg">
                        <div className="mb-6 text-center">
                            <div className="relative mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/5">
                                <div className="font-serif text-3xl font-black text-grad">{completionRate}%</div>
                                <svg className="absolute inset-0 h-full w-full -rotate-90">
                                    <circle
                                        cx="48" cy="48" r="44"
                                        fill="transparent"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        className="text-lav-acc"
                                        strokeDasharray={2 * Math.PI * 44}
                                        strokeDashoffset={2 * Math.PI * 44 * (1 - completionRate / 100)}
                                    />
                                </svg>
                            </div>
                            <div className="text-sm font-black text-white">Tiến độ ca làm</div>
                            <div className="mt-1 text-xs font-bold text-white/40">Hoàn thành để gửi báo cáo</div>
                        </div>

                        <div className="space-y-4 rounded-2xl bg-white/5 p-4">
                            <div className="flex items-center gap-3 text-xs font-bold text-white/60">
                                <ShieldCheck size={16} className="text-green-500" /> AI Security Monitoring Active
                            </div>
                            <div className="flex items-center gap-3 text-xs font-bold text-white/60">
                                <Camera size={16} className="text-lav-acc" /> Visual Verification Required
                            </div>
                        </div>

                        <div className="mt-6">
                            <div className="mb-2 text-xs font-black uppercase text-white/30">Ghi chú chuyên môn</div>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Nhập tình trạng sức khỏe của mẹ và bé..."
                                className="h-32 w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-semibold text-white outline-none focus:border-lav-acc/50"
                            />
                        </div>

                        <Btn full className="mt-6" disabled={completionRate < 100}>
                            <Send size={16} /> Gửi báo cáo & Kết thúc
                        </Btn>
                    </Card>

                    {/* AI Assistance */}
                    <div className="rounded-2xl bg-grad p-5 text-white shadow-lg">
                        <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider">
                            <Sparkles size={14} /> AI Suggestions
                        </div>
                        <p className="text-xs font-bold leading-relaxed text-white/80">
                            "Dựa trên các dấu hiệu, bé có thể đang bị hăm tã nhẹ. Bạn nên hướng dẫn mẹ sử dụng kem bôi chuyên dụng và giữ khô thoáng."
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checklist;
