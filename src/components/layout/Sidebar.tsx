import { Calendar, ClipboardCheck, Home, LogOut, MessageCircle, Scale, Search, User, Wallet } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const motherMenus = [
  { id: '/home', icon: <Home size={18} />, label: 'Trang chủ' },
  { id: '/search', icon: <Search size={18} />, label: 'Tìm điều dưỡng' },
  { id: '/compare', icon: <Scale size={18} />, label: 'So sánh' },
  { id: '/bookings', icon: <Calendar size={18} />, label: 'Đơn của tôi' },
  { id: '/chat', icon: <MessageCircle size={18} />, label: 'Chat & AI hỗ trợ' },
  { id: '/profile', icon: <User size={18} />, label: 'Hồ sơ' },
];

const nurseMenus = [
  { id: '/home', icon: <Home size={18} />, label: 'Trang chủ' },
  { id: '/bookings', icon: <Calendar size={18} />, label: 'Lịch làm việc' },
  { id: '/checklist', icon: <ClipboardCheck size={18} />, label: 'AI Checklist' },
  { id: '/wallet', icon: <Wallet size={18} />, label: 'Ví & Thu nhập' },
  { id: '/chat', icon: <MessageCircle size={18} />, label: 'Chat & hỗ trợ' },
  { id: '/profile', icon: <User size={18} />, label: 'Hồ sơ nurse' },
];

const adminMenus = [
  { id: '/home', icon: <Home size={18} />, label: 'Trang chủ' },
  { id: '/admin/gmv', icon: <Scale size={18} />, label: 'Dashboard GMV' },
  { id: '/admin/nurses', icon: <ClipboardCheck size={18} />, label: 'Duyệt điều dưỡng' },
  { id: '/admin/users', icon: <User size={18} />, label: 'Quản lý người dùng' },
  { id: '/admin/bookings', icon: <Calendar size={18} />, label: 'Quản lý lịch hẹn' },
  { id: '/profile', icon: <User size={18} />, label: 'Hồ sơ Admin' },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, primaryRole } = useAuth();

  const menus = primaryRole === 'ADMIN' ? adminMenus : (primaryRole === 'NURSE' ? nurseMenus : motherMenus);
  const roleLabel = primaryRole === 'ADMIN' ? 'Hệ thống' : (primaryRole === 'NURSE' ? 'Điều dưỡng' : 'Mẹ bỉm');

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <aside className="fixed left-0 top-0 z-20 flex min-h-screen w-[232px] flex-col bg-dark-200">
      <div className="border-b border-white/5 px-5 pb-[18px] pt-[22px]">
        <div className="mb-1.5 flex cursor-pointer items-center gap-[9px]" onClick={() => navigate('/')}>
          <img src="/image/logo.png" alt="Happabi" className="h-[34px] w-[34px] rounded-[10px] object-cover" />
          <span className="font-serif text-[21px] font-black text-grad">Happabi</span>
        </div>
        <div className="pl-0.5 text-[10.5px] uppercase tracking-[1.2px] text-white/30">{roleLabel}</div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 py-3.5">
        {menus.map((item) => {
          const isActive = location.pathname === item.id;
          return (
            <div
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`mb-[3px] flex cursor-pointer items-center gap-2.5 rounded-xl border-l-[3px] px-3.5 py-2.5 text-[13.5px] transition-all duration-150 ${isActive
                ? 'border-lav-acc bg-[rgba(192,132,252,0.16)] font-bold text-white'
                : 'border-transparent bg-transparent font-normal text-white/50 hover:bg-white/5 hover:text-white/70'
                }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-white/5 px-2.5 py-3.5">
        <div
          onClick={handleLogout}
          className="flex cursor-pointer items-center gap-[9px] rounded-xl px-3.5 py-2.5 text-[13px] text-white/35 transition-colors hover:bg-white/5 hover:text-white/70"
        >
          <LogOut size={16} /> Đăng xuất
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
