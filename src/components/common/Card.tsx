import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`bg-white rounded-[20px] border border-lav-200 shadow-[0_4px_24px_rgba(168,85,247,0.09)] p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
