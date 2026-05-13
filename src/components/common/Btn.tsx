import React, { useState } from 'react';

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'grad' | 'outline' | 'ghost' | 'danger' | 'soft' | 'pink' | 'dark';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  full?: boolean;
}

const Btn: React.FC<BtnProps> = ({ 
  children, 
  variant = 'grad', 
  full = false, 
  size = 'md', 
  disabled = false, 
  className = '',
  ...props 
}) => {
  const [hov, setHov] = useState(false);

  const sizeClasses = {
    xs: 'text-[11px] px-3 py-[5px]',
    sm: 'text-[12.5px] px-4 py-2',
    md: 'text-[14px] px-5 py-[10px]',
    lg: 'text-[16px] px-8 py-[14px]'
  };

  const variants = {
    grad: `bg-grad text-white shadow-[0_4px_14px_rgba(192,132,252,0.4)] ${hov && !disabled ? 'shadow-[0_8px_24px_rgba(192,132,252,0.52)]' : ''}`,
    outline: 'bg-white text-lav-dark border-1.5 border-lav-300',
    ghost: 'bg-transparent text-text-mid',
    danger: 'bg-danger-bg text-danger border border-red-200',
    soft: 'bg-lav-100 text-lav-dark border border-lav-200',
    pink: 'bg-pink-100 text-pink-dark border border-pink-200',
    dark: 'bg-dark-100 text-white'
  };

  return (
    <button 
      className={`
        border-none rounded-xl font-serif font-bold transition-all duration-200 
        inline-flex items-center gap-1.5 justify-center
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-[1px]'}
        ${full ? 'w-full' : 'w-auto'}
        ${sizeClasses[size]}
        ${variants[variant]}
        ${className}
      `}
      disabled={disabled}
      onMouseEnter={() => setHov(true)} 
      onMouseLeave={() => setHov(false)}
      {...props}
    >
      {children}
    </button>
  );
};

export default Btn;
