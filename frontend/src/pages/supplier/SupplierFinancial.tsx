import React, { useState, useEffect } from 'react';
import { supplierFinancialService, FinancialReport, FinancialSummary, TaxReport, CommissionBreakdown, FinancialFilters } from '@/services/supplierFinancialService';
import { getUserFriendlyError } from '@/utils/errorMessages';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Alert from '@/components/common/Alert';
import SupplierPageWrapper from '@/components/layout/SupplierPageWrapper';
import SupplierCardLayout from '@/components/layout/SupplierCardLayout';
import SupplierGridLayout from '@/components/layout/SupplierGridLayout';

type FinancialTab = 'overview' | 'reports' | 'tax' | 'commission';

const SupplierFinancial: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FinancialTab>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [taxReport, setTaxReport] = useState<TaxReport | null>(null);
  const [commissionBreakdown, setCommissionBreakdown] = useState<CommissionBreakdown | null>(null);

  // Filters
  const [filters, setFilters] = useState<FinancialFilters>({
    period: '30d',
    date_from: '',
    date_to: '',
    report_type: 'summary',
    group_by: 'month',
    year: new Date().getFullYear()
  });

  useEffect(() => {
    fetchFinancialData();
  }, [activeTab, filters]);

  const fetchFinancialData = async () => {
    setLoading(true);
    setError('');
    try {
      switch (activeTab) {
        case 'overview':
          const summaryResponse = await supplierFinancialService.getFinancialSummary(filters.period || '30d');
          if (summaryResponse.success) {
            setSummary(summaryResponse.data || null);
          } else {
            setError(summaryResponse.message || 'Failed to load financial summary');
          }
          break;
        case 'reports':
          const reportResponse = await supplierFinancialService.getFinancialReport(filters);
          if (reportResponse.success) {
            setReport(reportResponse.data || null);
          } else {
            setError(reportResponse.message || 'Failed to load financial report');
          }
          break;
        case 'tax':
          const taxResponse = await supplierFinancialService.getTaxReport(filters);
          if (taxResponse.success) {
            setTaxReport(taxResponse.data || null);
          } else {
            setError(taxResponse.message || 'Failed to load tax report');
          }
          break;
        case 'commission':
          const commissionResponse = await supplierFinancialService.getCommissionBreakdown(filters);
          if (commissionResponse.success) {
            setCommissionBreakdown(commissionResponse.data || null);
          } else {
            setError(commissionResponse.message || 'Failed to load commission breakdown');
          }
          break;
      }
    } catch (err) {
      setError(getUserFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return 'N/A';
    return `€${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercentage = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return 'N/A';
    return `${numValue > 0 ? '+' : ''}${numValue.toFixed(1)}%`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getGrowthColor = (value: string) => {
    const numValue = parseFloat(value);
    if (numValue > 0) return 'text-green-600';
    if (numValue < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <SupplierPageWrapper
      title="Financial Reports"
      subtitle="Track your revenue, commissions, and financial performance"
      headerActions={
        <div className="flex items-center space-x-3">
          {activeTab === 'overview' && (
            <select
              value={filters.period || '30d'}
              onChange={(e) => setFilters({ ...filters, period: e.target.value })}
              className="input-sm"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
            </select>
          )}
          {activeTab === 'reports' && (
            <div className="flex space-x-2">
              <input
                type="date"
                value={filters.date_from || ''}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                className="input-sm"
                placeholder="From Date"
              />
              <input
                type="date"
                value={filters.date_to || ''}
                onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                className="input-sm"
                placeholder="To Date"
              />
            </div>
          )}
          {activeTab === 'tax' && (
            <select
              value={filters.year || new Date().getFullYear()}
              onChange={(e) => setFilters({ ...filters, year: parseInt(e.target.value) })}
              className="input-sm"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          )}
        </div>
      }
    >
      {error && (
        <Alert type="error" message={error} onClose={() => setError('')} className="mb-6" />
      )}

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {[
              { id: 'overview', name: 'Overview' },
              { id: 'reports', name: 'Detailed Reports' },
              { id: 'tax', name: 'Tax Reports' },
              { id: 'commission', name: 'Commission' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as FinancialTab)}
                className={`
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                `}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && summary && (
        <div className="space-y-6">
          <SupplierGridLayout columns="4" gap={6}>
            <SupplierCardLayout>
              <h4 className="text-sm font-medium text-gray-500">Total Revenue</h4>
              <p className="mt-1 text-3xl font-semibold text-gray-900">{formatCurrency(summary.current_period.total_revenue)}</p>
              <p className={`mt-1 text-sm ${getGrowthColor(summary.growth.revenue_growth)}`}>
                {formatPercentage(summary.growth.revenue_growth)} from previous period
              </p>
            </SupplierCardLayout>
            <SupplierCardLayout>
              <h4 className="text-sm font-medium text-gray-500">Net Revenue</h4>
              <p className="mt-1 text-3xl font-semibold text-gray-900">{formatCurrency(summary.current_period.net_revenue)}</p>
              <p className={`mt-1 text-sm ${getGrowthColor(summary.growth.net_revenue_growth)}`}>
                {formatPercentage(summary.growth.net_revenue_growth)} from previous period
              </p>
            </SupplierCardLayout>
            <SupplierCardLayout>
              <h4 className="text-sm font-medium text-gray-500">Total Orders</h4>
              <p className="mt-1 text-3xl font-semibold text-gray-900">{summary.current_period.orders_count}</p>
              <p className={`mt-1 text-sm ${getGrowthColor(summary.growth.orders_growth)}`}>
                {formatPercentage(summary.growth.orders_growth)} from previous period
              </p>
            </SupplierCardLayout>
            <SupplierCardLayout>
              <h4 className="text-sm font-medium text-gray-500">Avg. Order Value</h4>
              <p className="mt-1 text-3xl font-semibold text-gray-900">{formatCurrency(summary.current_period.avg_order_value)}</p>
            </SupplierCardLayout>
          </SupplierGridLayout>

          <SupplierGridLayout columns="3" gap={6}>
            <SupplierCardLayout>
              <h4 className="text-sm font-medium text-gray-500">Completed Orders</h4>
              <p className="mt-1 text-2xl font-semibold text-green-600">{summary.current_period.completed_orders}</p>
              <p className="mt-1 text-sm text-gray-500">
                {formatCurrency(summary.current_period.completed_revenue)} revenue
              </p>
            </SupplierCardLayout>
            <SupplierCardLayout>
              <h4 className="text-sm font-medium text-gray-500">Platform Commission</h4>
              <p className="mt-1 text-2xl font-semibold text-orange-600">{formatCurrency(summary.current_period.total_commission)}</p>
            </SupplierCardLayout>
            <SupplierCardLayout>
              <h4 className="text-sm font-medium text-gray-500">Orders Today</h4>
              <p className="mt-1 text-2xl font-semibold text-blue-600">{summary.current_period.orders_today}</p>
            </SupplierCardLayout>
          </SupplierGridLayout>
        </div>
      )}

      {activeTab === 'reports' && report && (
        <div className="space-y-6">
          <SupplierCardLayout>
            <h3 className="text-lg font-medium text-gray-900 mb-6">Financial Summary</h3>
            <SupplierGridLayout columns="3" gap={6}>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Total Revenue</h4>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{formatCurrency(report.summary.total_revenue)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Net Revenue</h4>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{formatCurrency(report.summary.net_revenue)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Total Orders</h4>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{report.summary.total_orders}</p>
              </div>
            </SupplierGridLayout>
          </SupplierCardLayout>

          <SupplierCardLayout>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue by Category</h3>
            {report.revenue_by_category.length === 0 ? (
              <p className="text-gray-500">No category data available.</p>
            ) : (
              <div className="space-y-3">
                {report.revenue_by_category.map((category, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200">
                    <div>
                      <span className="font-medium text-gray-900">{category.category_name}</span>
                      <span className="ml-2 text-sm text-gray-500">({category.order_count} orders)</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium text-gray-900">{formatCurrency(category.revenue)}</span>
                      <div className="text-sm text-gray-500">{formatCurrency(category.avg_order_value)} avg</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SupplierCardLayout>

          <SupplierCardLayout>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Customers</h3>
            {report.top_customers.length === 0 ? (
              <p className="text-gray-500">No customer data available.</p>
            ) : (
              <div className="space-y-3">
                {report.top_customers.map((customer, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200">
                    <div>
                      <span className="font-medium text-gray-900">
                        {customer.first_name} {customer.last_name}
                      </span>
                      {customer.company_name && (
                        <span className="ml-2 text-sm text-gray-500">({customer.company_name})</span>
                      )}
                      <div className="text-sm text-gray-500">{customer.order_count} orders</div>
                    </div>
                    <div className="text-right">
                      <span className="font-medium text-gray-900">{formatCurrency(customer.total_revenue)}</span>
                      <div className="text-sm text-gray-500">{formatCurrency(customer.avg_order_value)} avg</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SupplierCardLayout>

          {report.detailed_orders && report.detailed_orders.length > 0 && (
            <SupplierCardLayout>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Detailed Orders</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {report.detailed_orders.slice(0, 10).map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.order_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.project_title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.customer_first_name} {order.customer_last_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(order.net_amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(order.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SupplierCardLayout>
          )}
        </div>
      )}

      {activeTab === 'tax' && taxReport && (
        <div className="space-y-6">
          <SupplierCardLayout>
            <h3 className="text-lg font-medium text-gray-900 mb-6">Tax Year {taxReport.tax_year} Summary</h3>
            <SupplierGridLayout columns="4" gap={6}>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Total Orders</h4>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{taxReport.annual_total.total_orders}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Gross Revenue</h4>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{formatCurrency(taxReport.annual_total.annual_gross_revenue)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Platform Commission</h4>
                <p className="mt-1 text-2xl font-semibold text-orange-600">{formatCurrency(taxReport.annual_total.annual_platform_commission)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Net Revenue</h4>
                <p className="mt-1 text-2xl font-semibold text-green-600">{formatCurrency(taxReport.annual_total.annual_net_revenue)}</p>
              </div>
            </SupplierGridLayout>
          </SupplierCardLayout>

          <SupplierCardLayout>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quarterly Breakdown</h3>
            <div className="space-y-4">
              {taxReport.quarterly_totals.map((quarter, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Q{quarter.quarter} {taxReport.tax_year}</h4>
                  <SupplierGridLayout columns="4" gap={4}>
                    <div>
                      <span className="text-sm text-gray-500">Orders</span>
                      <p className="font-medium text-gray-900">{quarter.orders}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Gross Revenue</span>
                      <p className="font-medium text-gray-900">{formatCurrency(quarter.gross_revenue)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Commission</span>
                      <p className="font-medium text-orange-600">{formatCurrency(quarter.platform_commission)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Net Revenue</span>
                      <p className="font-medium text-green-600">{formatCurrency(quarter.net_revenue)}</p>
                    </div>
                  </SupplierGridLayout>
                </div>
              ))}
            </div>
          </SupplierCardLayout>

          <SupplierCardLayout>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Revenue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Revenue</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {taxReport.monthly_breakdown.map((month, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {month.period}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {month.total_orders}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(month.gross_revenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">
                        {formatCurrency(month.platform_commission)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        {formatCurrency(month.net_revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SupplierCardLayout>
        </div>
      )}

      {activeTab === 'commission' && commissionBreakdown && (
        <div className="space-y-6">
          <SupplierCardLayout>
            <h3 className="text-lg font-medium text-gray-900 mb-6">Commission Summary</h3>
            <SupplierGridLayout columns="4" gap={6}>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Total Gross Revenue</h4>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{formatCurrency(commissionBreakdown.total_summary.total_gross_revenue)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Total Commission Paid</h4>
                <p className="mt-1 text-2xl font-semibold text-orange-600">{formatCurrency(commissionBreakdown.total_summary.total_commission_paid)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Overall Commission Rate</h4>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{commissionBreakdown.total_summary.overall_commission_rate.toFixed(2)}%</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Total Net Earnings</h4>
                <p className="mt-1 text-2xl font-semibold text-green-600">{formatCurrency(commissionBreakdown.total_summary.total_net_earnings)}</p>
              </div>
            </SupplierGridLayout>
          </SupplierCardLayout>

          <SupplierCardLayout>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Commission Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Revenue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Earnings</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {commissionBreakdown.monthly_breakdown.map((month, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {month.period}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {month.order_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(month.gross_revenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">
                        {formatCurrency(month.commission_paid)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {month.avg_commission_rate.toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        {formatCurrency(month.net_earnings)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SupplierCardLayout>
        </div>
      )}
    </SupplierPageWrapper>
  );
};

export default SupplierFinancial;
