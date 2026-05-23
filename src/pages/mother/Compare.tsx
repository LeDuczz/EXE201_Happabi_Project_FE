import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ShieldCheck, MapPin, DollarSign, Award, ThumbsUp } from 'lucide-react';
import Card from '../../components/common/Card';
import Btn from '../../components/common/Btn';
import Avatar from '../../components/common/Avatar';
import Topbar from '../../components/layout/Topbar';
import { Stars } from '../../components/common/Misc';

// Mock data (matching Search.tsx)
const NURSES = [
    {
        id: '1', name: "Nguyễn Thị Lan Anh", title: "Điều dưỡng trưởng", exp: 8, rating: 4.97, reviews: 124,
        skills: ["Hậu sản", "Tắm bé sơ sinh", "Hỗ trợ cho con bú", "Massage sau sinh", "Dinh dưỡng"],
        distance: 1.2, price: 350000, available: true, avatar: "LA", verified: true, cancelRate: "2%",
        location: "Quận 7, TP.HCM", completedCases: 312, responseTime: "< 15 phút",
        bio: "8 năm kinh nghiệm tại BV Từ Dũ, chuyên sâu phục hồi sau sinh. Tận tâm, chu đáo."
    },
    {
        id: '2', name: "Trần Minh Châu", title: "Nữ hộ sinh cao cấp", exp: 12, rating: 4.95, reviews: 89,
        skills: ["Phục hồi sau sinh", "Massage", "Dinh dưỡng mẹ bỉm", "Sơ sinh", "Tắm bé sơ sinh"],
        distance: 2.1, price: 420000, available: true, avatar: "MC", verified: true, cancelRate: "1%",
        location: "Quận 5, TP.HCM", completedCases: 247, responseTime: "< 10 phút",
        bio: "12 năm là nữ hộ sinh tại BV Hùng Vương. Chuyên xử lý tắc tia sữa và phục hồi thể chất."
    },
    {
        id: '3', name: "Võ Thị Mỹ Linh", title: "Chuyên gia hậu sản", exp: 15, rating: 4.99, reviews: 201,
        skills: ["Hậu sản", "Phục hồi sinh mổ", "Sơ sinh", "Dinh dưỡng", "Massage", "Hỗ trợ cho con bú"],
        distance: 4.1, price: 520000, available: true, avatar: "ML", verified: true, cancelRate: "0.5%",
        location: "Quận 3, TP.HCM", completedCases: 580, responseTime: "< 10 phút",
        bio: "15 năm kinh nghiệm, từng công tác tại Singapore. Chuyên gia phục hồi tổng thể."
    }
];

const Compare = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { compareIds } = (location.state as { compareIds: string[] }) || { compareIds: [] };

    const selectedNurses = NURSES.filter(n => compareIds.includes(n.id));

    if (selectedNurses.length < 2) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
                <div className="mb-6 text-7xl opacity-20">⚖️</div>
                <h2 className="font-serif text-3xl font-black text-text-dark">Hãy chọn 2 điều dưỡng</h2>
                <p className="mt-2 text-text-mid">Vui lòng quay lại tìm kiếm và chọn 2 người để so sánh chi tiết.</p>
                <Btn variant="grad" className="mt-8" onClick={() => navigate('/search')}>Quay lại tìm kiếm</Btn>
            </div>
        );
    }

    const [n1, n2] = selectedNurses;

    const CompareRow = ({ label, icon: Icon, val1, val2, highlightBetter = false }: { label: string, icon: any, val1: any, val2: any, highlightBetter?: boolean }) => {
        const isBetter1 = highlightBetter && (typeof val1 === 'number' ? val1 > val2 : val1 < val2);
        const isBetter2 = highlightBetter && (typeof val1 === 'number' ? val2 > val1 : val2 < val1);

        return (
            <div className="grid grid-cols-3 border-b border-lav-100 py-4 last:border-0 hover:bg-lav-50/30">
                <div className="flex items-center gap-3 pl-4 text-sm font-bold text-text-light">
                    <Icon size={18} className="text-lav-dark" />
                    {label}
                </div>
                <div className={`px-6 text-center ${isBetter1 ? 'bg-verified-bg/30 text-verified' : ''}`}>
                    <span className="font-serif text-lg font-black">{val1}</span>
                    {isBetter1 && <ThumbsUp size={14} className="ml-2 inline" />}
                </div>
                <div className={`px-6 text-center border-l border-lav-100 ${isBetter2 ? 'bg-verified-bg/30 text-verified' : ''}`}>
                    <span className="font-serif text-lg font-black">{val2}</span>
                    {isBetter2 && <ThumbsUp size={14} className="ml-2 inline" />}
                </div>
            </div>
        );
    };

    return (
        <div className="pb-10">
            <div className="mb-8 flex items-center justify-between">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-bold text-lav-dark hover:underline">
                    <ArrowLeft size={16} /> Quay lại
                </button>
                <Topbar title="So sánh điều dưỡng" subtitle="Phân tích chi tiết giúp mẹ đưa ra quyết định đúng đắn." />
                <div className="w-20" /> {/* Spacer */}
            </div>

            <Card className="overflow-hidden p-0">
                {/* Header Section */}
                <div className="grid grid-cols-3 bg-lav-100">
                    <div className="flex items-center p-8 text-xs font-black uppercase tracking-widest text-lav-dark/60">
                        Tiêu chí so sánh
                    </div>
                    {selectedNurses.map((n, i) => (
                        <div key={n.id} className={`p-8 text-center ${i === 1 ? 'border-l border-lav-200' : ''}`}>
                            <Avatar initials={n.avatar} size={80} />
                            <h3 className="font-serif text-2xl font-black text-text-dark">{n.name}</h3>
                            <p className="text-sm font-bold text-lav-dark">{n.title}</p>
                            <div className="mt-2 flex justify-center">
                                <Stars rating={n.rating} size={14} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Content Rows */}
                <CompareRow
                    label="Kinh nghiệm"
                    icon={Award}
                    val1={n1.exp}
                    val2={n2.exp}
                    highlightBetter
                />
                <CompareRow
                    label="Đánh giá (S)"
                    icon={Stars}
                    val1={n1.rating}
                    val2={n2.rating}
                    highlightBetter
                />
                <CompareRow
                    label="Tổng ca thành công"
                    icon={CheckCircle2}
                    val1={n1.completedCases}
                    val2={n2.completedCases}
                    highlightBetter
                />
                <CompareRow
                    label="Giá mỗi ca"
                    icon={DollarSign}
                    val1={n1.price}
                    val2={n2.price}
                    highlightBetter={false} // Price needs complex highlight logic
                />
                <CompareRow
                    label="Khoảng cách"
                    icon={MapPin}
                    val1={n1.distance}
                    val2={n2.distance}
                    highlightBetter
                />
                <CompareRow
                    label="Tỷ lệ huỷ"
                    icon={ThumbsUp}
                    val1={parseFloat(n1.cancelRate)}
                    val2={parseFloat(n2.cancelRate)}
                    highlightBetter={false} // Lower is better
                />

                {/* Skills Section */}
                <div className="grid grid-cols-3 border-b border-lav-100 py-6 hover:bg-lav-50/30">
                    <div className="flex items-center gap-3 pl-4 text-sm font-bold text-text-light">
                        <ShieldCheck size={18} className="text-lav-dark" />
                        Kỹ năng nổi bật
                    </div>
                    <div className="px-6 text-center">
                        <div className="flex flex-wrap justify-center gap-1.5">
                            {n1.skills.map(s => <span key={s} className="rounded-lg bg-pink-100 px-3 py-1 text-[11px] font-bold text-pink-dark">{s}</span>)}
                        </div>
                    </div>
                    <div className="px-6 text-center border-l border-lav-100">
                        <div className="flex flex-wrap justify-center gap-1.5">
                            {n2.skills.map(s => <span key={s} className="rounded-lg bg-lav-100 px-3 py-1 text-[11px] font-bold text-lav-dark">{s}</span>)}
                        </div>
                    </div>
                </div>

                {/* Bio Section */}
                <div className="grid grid-cols-3 border-b border-lav-100 py-6 hover:bg-lav-50/30">
                    <div className="flex items-center gap-3 pl-4 text-sm font-bold text-text-light">
                        <ThumbsUp size={18} className="text-lav-dark" />
                        Giới thiệu
                    </div>
                    <div className="px-8 text-sm text-text-mid font-serif italic text-center">
                        "{n1.bio}"
                    </div>
                    <div className="px-8 text-sm text-text-mid font-serif italic text-center border-l border-lav-100">
                        "{n2.bio}"
                    </div>
                </div>

                {/* Action Row */}
                <div className="grid grid-cols-3 bg-lav-50 py-8">
                    <div />
                    <div className="px-10">
                        <Btn variant="grad" full onClick={() => alert(`Đã chọn ${n1.name}`)}>Đặt lịch ngay</Btn>
                    </div>
                    <div className="px-10 border-l border-lav-100">
                        <Btn variant="grad" full onClick={() => alert(`Đã chọn ${n2.name}`)}>Đặt lịch ngay</Btn>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default Compare;
