import {
  Calendar,
  ClipboardCheck,
  FileSearch,
  History,
  Home,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Scale,
  Search,
  Settings,
  ShieldCheck,
  Stethoscope,
  User,
  Users,
  Wallet,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../contexts/AuthContext';

const motherMenus = [
  { id: '/mother/home', icon: <Home size={18} />, label: 'Trang chủ' },
  { id: '/mother/search', icon: <Search size={18} />, label: 'Tìm điều dưỡng' },
  { id: '/mother/compare', icon: <Scale size={18} />, label: 'So sánh' },
  { id: '/mother/bookings/new', icon: <Calendar size={18} />, label: 'Đặt lịch' },
  { id: '/mother/bookings', icon: <Calendar size={18} />, label: 'Đơn của tôi' },
  { id: '/mother/chat', icon: <MessageCircle size={18} />, label: 'Chat & AI hỗ trợ' },
  { id: '/mother/profile', icon: <User size={18} />, label: 'Hồ sơ' },
];

const nurseMenus = [
  { id: '/nurse/onboarding', icon: <ShieldCheck size={18} />, label: 'Onboarding nurse' },
  { id: '/nurse/home', icon: <Home size={18} />, label: 'Trang chủ' },
  { id: '/nurse/bookings', icon: <Calendar size={18} />, label: 'Lịch làm việc' },
  { id: '/nurse/checklist', icon: <ClipboardCheck size={18} />, label: 'AI Checklist' },
  { id: '/nurse/revenue', icon: <Wallet size={18} />, label: 'Doanh thu' },
  { id: '/nurse/chat', icon: <MessageCircle size={18} />, label: 'Chat & hỗ trợ' },
  { id: '/nurse/profile', icon: <User size={18} />, label: 'Hồ sơ nurse' },
];

const doctorMenus = [
  { id: '/doctor/nurses/review', icon: <FileSearch size={18} />, label: 'Duyệt hồ sơ điều dưỡng' },
  { id: '/doctor/chat', icon: <MessageCircle size={18} />, label: 'Chat & AI' },
  { id: '/doctor/profile', icon: <User size={18} />, label: 'Hồ sơ' },
];

const adminMenus = [
  { id: '/admin/dashboard', icon: <LayoutDashboard size={18} />, label: 'Tổng quan & GMV' },
  { id: '/admin/doctors', icon: <Stethoscope size={18} />, label: 'Tạo tài khoản Doctor' },
  { id: '/admin/users', icon: <Users size={18} />, label: 'Quản lý người dùng' },
  { id: '/admin/audit-logs', icon: <History size={18} />, label: 'Audit Logs' },
  { id: '/admin/system-config', icon: <Settings size={18} />, label: 'Cấu hình hệ thống' },
  { id: '/admin/chat', icon: <MessageCircle size={18} />, label: 'Hệ thống Chat' },
  { id: '/admin/profile', icon: <User size={18} />, label: 'Hồ sơ' },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, primaryRole } = useAuth();
  const [nurseStatus, setNurseStatus] = useState<string | null>(null);

  useEffect(() => {
    if (primaryRole !== 'NURSE') {
      setNurseStatus(null);
      return;
    }

    let ignore = false;
    axiosClient.get('/api/v1/nurses/me/onboarding')
      .then((response) => {
        if (!ignore) setNurseStatus(response.data?.data?.nurseStatus ?? null);
      })
      .catch(() => {
        if (!ignore) setNurseStatus(null);
      });

    return () => {
      ignore = true;
    };
  }, [primaryRole]);

  const visibleNurseMenus = nurseStatus === 'ACTIVE'
    ? nurseMenus.filter((item) => item.id !== '/nurse/onboarding')
    : nurseMenus;

  const menus = primaryRole === 'NURSE'
    ? visibleNurseMenus
    : primaryRole === 'DOCTOR'
      ? doctorMenus
      : primaryRole === 'ADMIN'
        ? adminMenus
        : motherMenus;

  const roleLabel = primaryRole === 'NURSE'
    ? 'Điều dưỡng'
    : primaryRole === 'DOCTOR'
      ? 'Doctor'
      : primaryRole === 'ADMIN'
        ? 'Admin'
        : 'Mẹ bỉm';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <aside className="fixed left-0 top-0 z-20 flex min-h-screen w-[232px] flex-col bg-dark-200">
      <div className="border-b border-white/5 px-5 pb-[18px] pt-[22px]">
        <div className="mb-1.5 flex cursor-pointer items-center gap-[9px]" onClick={() => navigate('/')}>
          <img src="/image/logo.png" alt="Happabi" className="h-[34px] w-[34px] rounded-[10px] object-cover" />
          <span className="text-[21px] font-semibold text-grad">Happabi</span>
        </div>
        <div className="pl-0.5 text-overline text-white/30">{roleLabel}</div>
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
