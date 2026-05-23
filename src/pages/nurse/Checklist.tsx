import { useState } from 'react';
import { Check, ShieldCheck, Camera, AlertTriangle } from 'lucide-react';
import Card from '../../components/common/Card';
import Btn from '../../components/common/Btn';
import Topbar from '../../components/layout/Topbar';
import { ProgressBar, Divider } from '../../components/common/Misc';

const Checklist = () => {
    const [tasks, setTasks] = useState([
        { id: 1, text: "Chào hỏi, giới thiệu bản thân với gia đình", done: true, cat: "Chuẩn bị", priority: "normal" },
        { id: 2, text: "Rửa tay đúng quy trình 6 bước trước khi chăm sóc", done: true, cat: "Chuẩn bị", priority: "high" },
        { id: 3, text: "Đo nhiệt độ cơ thể mẹ — bình thường 36.5–37.5°C", done: true, cat: "Kiểm tra mẹ", priority: "high" },
        { id: 4, text: "Kiểm tra huyết áp mẹ (bình thường 90–140/60–90 mmHg)", done: false, cat: "Kiểm tra mẹ", priority: "high" },
        { id: 5, text: "Quan sát vết mổ/vết may — không đỏ, sưng, mưng mủ", done: false, cat: "Kiểm tra mẹ", priority: "high" },
        { id: 6, text: "Theo dõi sản dịch (màu, mùi, lượng — bình thường nâu nhạt)", done: false, cat: "Kiểm tra mẹ", priority: "normal" },
        { id: 11, text: "Đo nhiệt độ bé — bình thường 36.5–37.4°C", done: true, cat: "Kiểm tra bé", priority: "high" },
        { id: 12, text: "Vệ sinh rốn bằng cồn 70° — quan sát tình trạng rốn", done: true, cat: "Kiểm tra bé", priority: "high" },
        { id: 13, text: "Tắm bé đúng kỹ thuật — nước 37°C, thời gian <10 phút", done: false, cat: "Kiểm tra bé", priority: "normal" },
        { id: 15, text: "Ghi nhận số lần bú, thời gian, tã ướt trong ca", done: false, cat: "Kiểm tra bé", priority: "normal" },
    ]);

    const toggleTask = (id: number) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
    };

    const doneCount = tasks.filter(t => t.done).length;
    const progress = (doneCount / tasks.length) * 100;

    return (
        <div className="pb-10">
            <Topbar title="AI Checklist" subtitle="Quy trình chăm sóc chuẩn y khoa cho mẹ và bé." />

            <div className="mb-8 grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h3 className="font-serif text-xl font-black text-text-dark">Tiến độ ca làm việc</h3>
                            <p className="text-xs font-bold text-text-light uppercase tracking-widest mt-1">Sản phụ: Chị Ngọc Hà · Bé: 15 ngày tuổi</p>
                        </div>
                        <div className="text-right">
                            <span className="font-serif text-3xl font-black text-lav-dark">{Math.round(progress)}%</span>
                            <p className="text-[10px] font-bold text-text-light uppercase">Đã hoàn thành</p>
                        </div>
                    </div>

                    <ProgressBar value={progress} />

                    <div className="mt-8 space-y-6">
                        {["Chuẩn bị", "Kiểm tra mẹ", "Kiểm tra bé"].map(cat => (
                            <div key={cat}>
                                <h4 className="mb-3 text-[11px] font-black uppercase tracking-widest text-lav-dark opacity-60 px-2">{cat}</h4>
                                <div className="space-y-2">
                                    {tasks.filter(t => t.cat === cat).map(task => (
                                        <div
                                            key={task.id}
                                            onClick={() => toggleTask(task.id)}
                                            className={`group flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-4 transition-all ${task.done ? 'border-lav-100 bg-lav-50/30' : 'border-transparent bg-white hover:border-lav-200 shadow-sm'}`}
                                        >
                                            <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg border-2 transition-all ${task.done ? 'border-verified bg-verified text-white' : 'border-lav-200 group-hover:border-lav-acc'}`}>
                                                {task.done && <Check size={14} strokeWidth={4} />}
                                            </div>
                                            <span className={`flex-1 text-sm font-bold transition-all ${task.done ? 'text-text-light line-through' : 'text-text-dark'}`}>
                                                {task.text}
                                            </span>
                                            {task.priority === 'high' && !task.done && (
                                                <div className="flex items-center gap-1 text-[10px] font-black text-danger uppercase bg-danger-bg px-2 py-1 rounded-md">
                                                    <AlertTriangle size={10} /> Quan trọng
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <div className="space-y-6">
                    <Card className="bg-grad text-white">
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest opacity-80">
                            <ShieldCheck size={16} /> AI Giám sát
                        </div>
                        <p className="mt-4 font-serif text-lg leading-relaxed font-bold">
                            "Hãy lưu ý kiểm tra kỹ huyết áp của mẹ sau khi massage co hồi tử cung để đảm bảo sức khoẻ ổn định nhất."
                        </p>
                        <Divider />
                        <Btn variant="outline" full className="!border-white/40 !bg-white/10 !text-white hover:!bg-white/20">
                            Hỏi AI chuyên môn
                        </Btn>
                    </Card>

                    <Card>
                        <h3 className="mb-4 font-serif text-lg font-black text-text-dark">Báo cáo ca làm</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between rounded-xl bg-lav-50 p-4">
                                <div className="flex items-center gap-3">
                                    <Camera size={20} className="text-lav-dark" />
                                    <span className="text-sm font-bold text-text-dark">Ảnh minh chứng</span>
                                </div>
                                <span className="text-xs font-bold text-lav-dark">Đã chụp 2 ảnh</span>
                            </div>
                            <textarea
                                placeholder="Ghi chú thêm về tình trạng mẹ và bé..."
                                className="w-full rounded-xl border-2 border-lav-100 p-4 text-sm font-bold text-text-dark outline-none focus:border-lav-acc h-32 resize-none"
                            />
                            <Btn variant="grad" full disabled={progress < 100}>
                                Gửi báo cáo & Kết thúc
                            </Btn>
                            <p className="text-center text-[10px] font-bold text-text-light">
                                *Bạn chỉ có thể kết thúc khi hoàn thành 100% checklist.
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Checklist;
