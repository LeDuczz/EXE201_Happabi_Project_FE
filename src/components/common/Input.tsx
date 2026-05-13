import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  hint?: string;
}

const Input: React.FC<InputProps> = ({ label, icon, hint, className = '', ...props }) => {
  return (
    <div className="mb-4">
      {label && (
        <div className="text-[12.5px] font-bold text-text-mid mb-1.5 tracking-[0.3px]">
          {label}
        </div>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base z-10 text-text-mid">
            {icon}
          </span>
        )}
        <input
          className={`
            w-full rounded-xl border border-lav-200 bg-white text-[15px] font-semibold text-text-dark outline-none transition-colors duration-200
            placeholder:text-text-light disabled:cursor-not-allowed disabled:bg-lav-100 disabled:text-text-light
            focus:border-lav-acc focus:ring-4 focus:ring-lav-100
            ${icon ? 'py-3 pr-3.5 pl-[38px]' : 'px-3.5 py-3'}
            ${className}
          `}
          {...props}
        />
      </div>
      {hint && <div className="text-[11px] text-text-light mt-1">{hint}</div>}
    </div>
  );
};

export default Input;
