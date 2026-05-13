import React from 'react';

export const Stars: React.FC<{ rating: number; size?: number }> = ({ rating, size = 13 }) => (
  <div className="flex gap-[1px] items-center">
    {[1, 2, 3, 4, 5].map(s => (
      <span 
        key={s} 
        style={{ fontSize: size }}
        className={s <= Math.floor(rating) ? 'text-[#f59e0b]' : 'text-lav-200'}
      >
        ★
      </span>
    ))}
    <span 
      className="text-text-mid ml-1 font-bold"
      style={{ fontSize: size - 1 }}
    >
      {rating}
    </span>
  </div>
);

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const m: Record<string, { label: string, bg: string, color: string }> = {
    completed: { label: "Hoàn thành", bg: "bg-verified-bg", color: "text-verified" },
    upcoming: { label: "Sắp tới", bg: "bg-lav-100", color: "text-lav-dark" },
    cancelled: { label: "Đã huỷ", bg: "bg-danger-bg", color: "text-danger" },
    pending: { label: "Chờ xác nhận", bg: "bg-yellow-100", color: "text-yellow-600" },
    inprogress: { label: "Đang diễn ra", bg: "bg-sky-100", color: "text-sky-600" }
  };
  
  const current = m[status] || { label: "Không rõ", bg: "bg-lav-100", color: "text-text-mid" };
  
  return (
    <span className={`${current.bg} ${current.color} text-[11px] font-bold px-2.5 py-1 rounded-[10px] whitespace-nowrap`}>
      {current.label}
    </span>
  );
};

export const Divider: React.FC = () => (
  <div className="h-px bg-lav-200 my-4" />
);

export const ProgressBar: React.FC<{ value: number; max?: number; colorClass?: string }> = ({ value, max = 100, colorClass = "bg-grad" }) => (
  <div className="bg-lav-200 rounded-lg h-2 overflow-hidden w-full">
    <div 
      className={`h-full rounded-lg transition-all duration-500 ease-out ${colorClass}`}
      style={{ width: `${Math.min((value / max) * 100, 100)}%` }} 
    />
  </div>
);
