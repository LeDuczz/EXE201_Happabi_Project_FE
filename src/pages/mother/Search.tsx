import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Filter, ArrowRight, Check, X } from 'lucide-react';
import Card from '../../components/common/Card';
import Btn from '../../components/common/Btn';
import Avatar from '../../components/common/Avatar';
import Tag from '../../components/common/Tag';
import Topbar from '../../components/layout/Topbar';
import { Stars, Divider } from '../../components/common/Misc';

// Mock data (matches backend structure)
const NURSES = [
    {
        id: '1', name: "Nguyễn Thị Lan Anh", title: "Điều dưỡng trưởng", exp: 8, rating: 4.97, reviews: 124,
        skills: ["Hậu sản", "Tắm bé sơ sinh", "Hỗ trợ cho con bú", "Massage sau sinh", "Dinh dưỡng"],
        distance: 1.2, price: 350000, available: true, avatar: "LA", verified: true, cancelRate: "2%",
        location: "Quận 7, TP.HCM", completedCases: 312, responseTime: "< 15 phút"
    },
    {
        id: '2', name: "Trần Minh Châu", title: "Nữ hộ sinh cao cấp", exp: 12, rating: 4.95, reviews: 89,
        skills: ["Phục hồi sau sinh", "Massage", "Dinh dưỡng mẹ bỉm", "Sơ sinh", "Tắm bé sơ sinh"],
        distance: 2.1, price: 420000, available: true, avatar: "MC", verified: true, cancelRate: "1%",
        location: "Quận 5, TP.HCM", completedCases: 247, responseTime: "< 10 phút"
    },
    {
        id: '3', name: "Võ Thị Mỹ Linh", title: "Chuyên gia hậu sản", exp: 15, rating: 4.99, reviews: 201,
        skills: ["Hậu sản", "Phục hồi sinh mổ", "Sơ sinh", "Dinh dưỡng", "Massage", "Hỗ trợ cho con bú"],
        distance: 4.1, price: 520000, available: true, avatar: "ML", verified: true, cancelRate: "0.5%",
        location: "Quận 3, TP.HCM", completedCases: 580, responseTime: "< 10 phút"
    },
    {
        id: '4', name: "Lê Thị Hồng Nhung", title: "Điều dưỡng chuyên khoa", exp: 5, rating: 4.90, reviews: 67,
        skills: ["Chăm sóc vết thương", "Theo dõi sức khỏe mẹ", "Bé non tháng", "Sơ sinh"],
        distance: 0.8, price: 300000, available: false, avatar: "HN", verified: true, cancelRate: "3%",
        location: "Quận 1, TP.HCM", completedCases: 143, responseTime: "< 30 phút"
    },
];

const Search = () => {
    const navigate = useNavigate();
    const [query, setQuery] = useState("");
    const [skill, setSkill] = useState("Tất cả");
    const [sort, setSort] = useState("AI gợi ý");
    const [showAvail, setShowAvail] = useState(false);
    const [showVerify, setShowVerify] = useState(false);
    const [compareIds, setCompareIds] = useState<string[]>([]);

    const allSkills = ["Tất cả", "Hậu sản", "Tắm bé sơ sinh", "Hỗ trợ cho con bú", "Massage", "Sơ sinh", "Dinh dưỡng"];

    const filtered = NURSES.filter(n => {
        const matchQuery = !query || n.name.toLowerCase().includes(query.toLowerCase()) || n.skills.some(s => s.toLowerCase().includes(query.toLowerCase()));
        const matchSkill = skill === "Tất cả" || n.skills.includes(skill);
        const matchAvail = !showAvail || n.available;
        const matchVerify = !showVerify || n.verified;
        return matchQuery && matchSkill && matchAvail && matchVerify;
    });

    const toggleCompare = (id: string) => {
        setCompareIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) :
                prev.length < 2 ? [...prev, id] : prev
        );
    };

    return (
        <div className="pb-10">
            <Topbar title="Tìm điều dưỡng" subtitle="Lựa chọn người chăm sóc tốt nhất cho mẹ và bé." />

            {/* Compare Floating Bar */}
            {compareIds.length > 0 && (
                <div className="fixed bottom-10 left-1/2 z-40 flex -translate-x-1/2 items-center gap-6 rounded-2xl bg-dark-100 px-8 py-4 shadow-2xl backdrop-blur-md">
                    <div className="flex -space-x-4">
                        {compareIds.map(id => {
                            const n = NURSES.find(x => x.id === id);
                            return n ? <Avatar key={id} initials={n.avatar} size={40} /> : null;
                        })}
                    </div>
                    <div className="text-sm font-bold text-white">
                        {compareIds.length}/2 đã chọn để so sánh
                    </div>
                    <div className="flex gap-3">
                        {compareIds.length === 2 && (
                            <Btn variant="grad" size="sm" onClick={() => navigate('/compare', { state: { compareIds } })}>
                                So sánh ngay <ArrowRight size={14} className="ml-1" />
                            </Btn>
                        )}
                        <button onClick={() => setCompareIds([])} className="text-white/50 hover:text-white">
                            <X size={20} />
                        </button>
                    </div>
                </div>
            )}

            <Card className="mb-8 p-6">
                <div className="mb-6 flex gap-4">
                    <div className="relative flex-1">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-lav-dark" size={20} />
                        <input
                            placeholder="Tìm theo tên, kỹ năng (ví dụ: Tắm bé, Hậu sản...)"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full rounded-2xl border-2 border-lav-100 bg-lav-50 py-3 pl-12 pr-4 font-serif text-lg text-text-dark outline-none focus:border-lav-acc"
                        />
                    </div>
                    <div className="flex items-center gap-2 rounded-2xl border-2 border-lav-100 px-4">
                        <Filter size={18} className="text-lav-dark" />
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                            className="bg-transparent text-sm font-bold text-text-dark outline-none"
                        >
                            {["AI gợi ý", "Đánh giá cao nhất", "Giá thấp nhất", "Gần nhất"].map(s => <option key={s}>{s}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {allSkills.map(s => (
                        <button
                            key={s}
                            onClick={() => setSkill(s)}
                            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${skill === s ? 'bg-grad text-white shadow-lg' : 'bg-lav-100 text-lav-dark hover:bg-lav-200'}`}
                        >
                            {s}
                        </button>
                    ))}
                    <div className="mx-2 h-8 w-px bg-lav-200" />
                    <button
                        onClick={() => setShowAvail(!showAvail)}
                        className={`flex items-center gap-2 rounded-xl border-2 px-4 py-2 text-xs font-bold transition-all ${showAvail ? 'border-lav-acc bg-lav-50 text-lav-dark' : 'border-lav-100 text-text-light'}`}
                    >
                        <div className={`h-4 w-4 rounded flex items-center justify-center transition-all ${showAvail ? 'bg-lav-acc text-white' : 'bg-lav-100'}`}>
                            {showAvail && <Check size={10} />}
                        </div>
                        Còn lịch
                    </button>
                    <button
                        onClick={() => setShowVerify(!showVerify)}
                        className={`flex items-center gap-2 rounded-xl border-2 px-4 py-2 text-xs font-bold transition-all ${showVerify ? 'border-lav-acc bg-lav-50 text-lav-dark' : 'border-lav-100 text-text-light'}`}
                    >
                        <div className={`h-4 w-4 rounded flex items-center justify-center transition-all ${showVerify ? 'bg-lav-acc text-white' : 'bg-lav-100'}`}>
                            {showVerify && <Check size={10} />}
                        </div>
                        Đã xác thực
                    </button>
                </div>
            </Card>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map(n => {
                    const inCompare = compareIds.includes(n.id);
                    return (
                        <Card key={n.id} className={`group overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${inCompare ? 'ring-2 ring-lav-acc ring-offset-4' : ''}`}>
                            <div className="relative p-6">
                                <div className="mb-4 flex items-center justify-between">
                                    {n.id === '3' && <Tag variant="grad">Robot Gợi ý</Tag>}
                                    <div className="flex gap-2">
                                        <Tag variant={n.available ? 'purple' : 'pink'}>{n.available ? 'Còn lịch' : 'Hết lịch'}</Tag>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <Avatar initials={n.avatar} size={64} />
                                    <div className="min-w-0 flex-1">
                                        <h3 className="truncate font-serif text-xl font-black text-text-dark">{n.name}</h3>
                                        <p className="text-xs font-bold text-text-light">{n.title} · {n.exp} năm KN</p>
                                        <div className="mt-1">
                                            <Stars rating={n.rating} size={12} />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-1.5">
                                    {n.skills.slice(0, 3).map(sk => (
                                        <span key={sk} className="rounded-lg bg-pink-100 px-2 py-1 text-[10px] font-bold text-pink-dark">{sk}</span>
                                    ))}
                                    {n.skills.length > 3 && <span className="rounded-lg bg-lav-100 px-2 py-1 text-[10px] font-bold text-lav-dark">+{n.skills.length - 3}</span>}
                                </div>

                                <div className="mt-4 grid grid-cols-3 gap-2">
                                    <div className="rounded-xl bg-lav-50 p-2 text-center">
                                        <p className="text-[10px] font-bold text-text-light uppercase">Ca làm</p>
                                        <p className="font-serif font-black text-lav-dark">{n.completedCases}</p>
                                    </div>
                                    <div className="rounded-xl bg-lav-50 p-2 text-center">
                                        <p className="text-[10px] font-bold text-text-light uppercase">Huỷ</p>
                                        <p className="font-serif font-black text-lav-dark">{n.cancelRate}</p>
                                    </div>
                                    <div className="rounded-xl bg-lav-50 p-2 text-center">
                                        <p className="text-[10px] font-bold text-text-light uppercase">Phản hồi</p>
                                        <p className="font-serif font-black text-lav-dark">{n.responseTime.replace("< ", "")}</p>
                                    </div>
                                </div>

                                <Divider />

                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[11px] font-bold text-text-light">Giá từ</p>
                                        <p className="font-serif text-2xl font-black text-lav-dark">{n.price.toLocaleString()}đ</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Btn
                                            variant={inCompare ? "pink" : "outline"}
                                            size="xs"
                                            onClick={() => toggleCompare(n.id)}
                                        >
                                            {inCompare ? 'Đang so sánh' : 'So sánh'}
                                        </Btn>
                                        <Btn variant="grad" size="xs" disabled={!n.available}>Đặt lịch</Btn>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {filtered.length === 0 && (
                <Card className="flex flex-col items-center justify-center p-20 text-center">
                    <div className="mb-4 text-6xl opacity-20">🔍</div>
                    <h3 className="font-serif text-2xl font-black text-text-dark">Không tìm thấy kết quả</h3>
                    <p className="mt-2 text-text-mid">Hãy thử thay đổi từ khoá hoặc điều chỉnh bộ lọc của bạn nhé!</p>
                    <Btn variant="soft" className="mt-6" onClick={() => { setQuery(""); setSkill("Tất cả"); setShowAvail(false); setShowVerify(false); }}>Xoá tất cả bộ lọc</Btn>
                </Card>
            )}
        </div>
    );
};

export default Search;
