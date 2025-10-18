import React, { ReactNode } from 'react';

interface SupplierContentLayoutProps {
  children: ReactNode;
  filters?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

const SupplierContentLayout: React.FC<SupplierContentLayoutProps> = ({
  children,
  filters,
  actions,
  className = ''
}) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Filters Section */}
      {filters && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {filters}
        </div>
      )}

      {/* Actions Section */}
      {actions && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {actions}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
};

export default SupplierContentLayout;
