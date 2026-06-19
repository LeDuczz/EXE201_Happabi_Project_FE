import React from 'react';

interface TagProps {
  children: React.ReactNode;
  variant?: 'purple' | 'pink' | 'green' | 'grad' | 'gray' | 'orange';
  size?: 'xs' | 'sm';
}

const Tag: React.FC<TagProps> = ({ children, variant = 'purple', size = 'sm' }) => {
  const variants = {
    purple: 'bg-lav-200 text-lav-dark',
    pink: 'bg-pink-100 text-pink-dark',
    green: 'bg-verified-bg text-verified',
    grad: 'bg-grad text-white',
    gray: 'bg-slate-100 text-slate-500',
    orange: 'bg-orange-50 text-orange-600'
  };

  const sizes = {
    xs: 'px-2 py-[3px]',
    sm: 'px-3 py-1'
  };

  return (
    <span className={`inline-flex items-center gap-[3px] font-medium rounded-full whitespace-nowrap text-caption ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
};

export default Tag;
