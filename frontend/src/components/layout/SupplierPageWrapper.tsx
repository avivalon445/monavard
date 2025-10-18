import React, { ReactNode } from 'react';
import SupplierPageLayout from './SupplierPageLayout';
import SupplierContentLayout from './SupplierContentLayout';

interface SupplierPageWrapperProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  headerActions?: ReactNode;
  filters?: ReactNode;
  actions?: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | '7xl' | 'full';
}

const SupplierPageWrapper: React.FC<SupplierPageWrapperProps> = ({
  children,
  title,
  subtitle,
  headerActions,
  filters,
  actions,
  className = '',
  maxWidth = '7xl'
}) => {
  return (
    <SupplierPageLayout
      title={title}
      subtitle={subtitle}
      headerActions={headerActions}
      maxWidth={maxWidth}
      className={className}
    >
      <SupplierContentLayout
        filters={filters}
        actions={actions}
      >
        {children}
      </SupplierContentLayout>
    </SupplierPageLayout>
  );
};

export default SupplierPageWrapper;
