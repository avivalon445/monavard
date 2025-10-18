import React, { ReactNode } from 'react';

interface SupplierCardLayoutProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}

const SupplierCardLayout: React.FC<SupplierCardLayoutProps> = ({
  children,
  className = '',
  hover = true,
  padding = 'md'
}) => {
  const getPaddingClass = () => {
    const paddingMap = {
      'sm': 'p-4',
      'md': 'p-6',
      'lg': 'p-8'
    };
    return paddingMap[padding] || 'p-6';
  };

  const hoverClass = hover ? 'hover:shadow-md transition-shadow duration-200' : '';

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${hoverClass} ${getPaddingClass()} ${className}`}>
      {children}
    </div>
  );
};

export default SupplierCardLayout;
