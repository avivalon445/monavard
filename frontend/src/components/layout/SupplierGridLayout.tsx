import React, { ReactNode } from 'react';

interface SupplierGridLayoutProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SupplierGridLayout: React.FC<SupplierGridLayoutProps> = ({
  children,
  columns = 3,
  gap = 'lg',
  className = ''
}) => {
  const getColumnsClass = () => {
    const columnsMap = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 lg:grid-cols-2',
      3: 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
      5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
      6: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6'
    };
    return columnsMap[columns] || 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3';
  };

  const getGapClass = () => {
    const gapMap = {
      'sm': 'gap-3',
      'md': 'gap-4',
      'lg': 'gap-6',
      'xl': 'gap-8'
    };
    return gapMap[gap] || 'gap-6';
  };

  return (
    <div className={`grid ${getColumnsClass()} ${getGapClass()} ${className}`}>
      {children}
    </div>
  );
};

export default SupplierGridLayout;
