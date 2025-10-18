import React, { ReactNode } from 'react';

interface SupplierPageLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  headerActions?: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | '7xl' | 'full';
}

const SupplierPageLayout: React.FC<SupplierPageLayoutProps> = ({
  children,
  title,
  subtitle,
  headerActions,
  className = '',
  maxWidth = '7xl'
}) => {
  const getMaxWidthClass = () => {
    const maxWidthMap = {
      'sm': 'max-w-sm',
      'md': 'max-w-md',
      'lg': 'max-w-lg',
      'xl': 'max-w-xl',
      '2xl': 'max-w-2xl',
      '4xl': 'max-w-4xl',
      '6xl': 'max-w-6xl',
      '7xl': 'max-w-7xl',
      'full': 'max-w-full'
    };
    return maxWidthMap[maxWidth] || 'max-w-7xl';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`${getMaxWidthClass()} mx-auto px-4 sm:px-6 lg:px-8`}>
        {/* Page Header */}
        <div className="py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-2 text-lg text-gray-600">
                  {subtitle}
                </p>
              )}
            </div>
            {headerActions && (
              <div className="mt-4 sm:mt-0 sm:ml-6">
                {headerActions}
              </div>
            )}
          </div>
        </div>

        {/* Page Content */}
        <div className={`pb-8 ${className}`}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default SupplierPageLayout;
