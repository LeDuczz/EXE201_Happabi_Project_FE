import { Bell } from 'lucide-react';
import Avatar from '../common/Avatar';
import { useAuth } from '../../contexts/AuthContext';

interface TopbarProps {
  title: string;
  subtitle?: string;
}

const getInitials = (name?: string) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const Topbar = ({ title, subtitle }: TopbarProps) => {
  const { user } = useAuth();
  const displayName = user?.fullName || user?.phone || 'Người dùng';

  return (
    <div className="mb-7 flex items-start justify-between">
      <div>
        <h1 className="font-serif text-[26px] font-black leading-[1.2] text-text-dark">{title}</h1>
        {subtitle && <p className="mt-1 text-[13.5px] text-text-light">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2.5">
        <div className="relative flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-[11px] border border-lav-200 bg-lav-100 text-lav-dark transition-colors hover:bg-lav-200">
          <Bell size={18} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-pink-dark" />
        </div>

        <div className="flex cursor-pointer items-center gap-2 rounded-xl border border-lav-200 bg-white py-1.5 pl-[7px] pr-3 shadow-sm transition-colors hover:border-lav-300">
          <Avatar initials={getInitials(user?.fullName)} size={30} src={user?.avatarUrl} />
          <span className="max-w-[140px] truncate text-[13px] font-semibold text-text-dark">{displayName}</span>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
