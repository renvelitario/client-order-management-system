import { useEffect, useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import DataTable, { DataTableEmptyState } from '../components/ui/DataTable';
import FilterDropdown from '../components/ui/FilterDropdown';
import Notification from '../components/ui/Notification';
import PageLoader from '../components/ui/PageLoader';
import api from '../utils/api';
import { getPresetRangeQuery, getPreviousPresetRangeQuery } from '../utils/dateRanges';
import { devError } from '../utils/devLogger';
import { formatDateOnly, formatPeso } from '../utils/formatters';
import type { Order } from '../types/app';
import { resolveApiErrorMessage } from '../types/app';
import '../styles/shared/table-ui-core.css';
import '../styles/shared/table-ui-layout-controls.css';
import '../styles/pages/analytics.css';

type RangeKey = 'this_month' | 'previous_month' | 'this_year' | 'all_time';

type AnalyticsSummary = {
  totalProducts: number;
  totalCustomers: number;
  totalOrders: number;
  totalSales: number;
  grossSales: number;
  totalDiscounts: number;
  totalDeliveryFees: number;
  averageOrderValue: number;
  activeCustomers: number;
  unassignedDeliveries: number;
  scheduledDeliveries: number;
  outForDelivery: number;
  pendingDeliveries: number;
  deliveredOrders: number;
  failedDeliveries: number;
  cancelledOrders: number;
  totalUnitsSold: number;
};

type TopProduct = {
  product_name: string;
  sold_quantity: number;
  revenue: number;
};

type TrendPoint = {
  month: string;
  revenue: number;
  orders: number;
};

type ReportDelta = {
  salesDeltaPct: number | null;
  ordersDeltaPct: number | null;
  deliveryRateDeltaPct: number | null;
};

type RecentOrder = Pick<Order, 'order_id' | 'customer_name' | 'delivery_date' | 'total_amount' | 'delivery_status'>;

const RANGE_OPTIONS: Array<{ value: RangeKey; label: string }> = [
  { value: 'this_month', label: 'This Month' },
  { value: 'previous_month', label: 'Previous Month' },
  { value: 'this_year', label: 'This Year' },
  { value: 'all_time', label: 'All Time' },
];

const INITIAL_SUMMARY: AnalyticsSummary = {
  totalProducts: 0,
  totalCustomers: 0,
  totalOrders: 0,
  totalSales: 0,
  grossSales: 0,
  totalDiscounts: 0,
  totalDeliveryFees: 0,
  averageOrderValue: 0,
  activeCustomers: 0,
  unassignedDeliveries: 0,
  scheduledDeliveries: 0,
  outForDelivery: 0,
  pendingDeliveries: 0,
  deliveredOrders: 0,
  failedDeliveries: 0,
  cancelledOrders: 0,
  totalUnitsSold: 0,
};

const monthLabel = (value: string): string => {
  const parsedDate = new Date(`${value}-01T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
};

const percentageDelta = (current: number, previous: number): number | null => {
  if (previous === 0) {
    return null;
  }

  return ((current - previous) / previous) * 100;
};

const formatDelta = (value: number | null): string => {
  if (value === null) {
    return 'N/A';
  }

  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
};

const normalizeDeliveryStatus = (value: string | null | undefined): string => {
  const normalized = String(value || '').toLowerCase();
  if (!normalized) {
    return 'Unassigned';
  }

  return normalized
    .split('_')
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ');
};

const Analytics = () => {
  const [range, setRange] = useState<RangeKey>('this_month');
  const [summary, setSummary] = useState<AnalyticsSummary>(INITIAL_SUMMARY);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [reportDelta, setReportDelta] = useState<ReportDelta>({
    salesDeltaPct: null,
    ordersDeltaPct: null,
    deliveryRateDeltaPct: null,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const reportRef = useRef<HTMLDivElement | null>(null);
  const rangeParams = useMemo(() => getPresetRangeQuery(range), [range]);
  const previousRangeParams = useMemo(() => getPreviousPresetRangeQuery(range), [range]);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      setError('');

      try {
        const [summaryRes, recentOrdersRes, previousSummaryRes] = await Promise.all([
          api.get('/dashboard/summary', { params: rangeParams }),
          api.get('/dashboard/recent-orders', { params: rangeParams }),
          previousRangeParams
            ? api.get('/dashboard/summary', { params: previousRangeParams })
            : Promise.resolve(null),
        ]);

        setSummary({
          totalProducts: Number(summaryRes.data?.summary?.totalProducts || 0),
          totalCustomers: Number(summaryRes.data?.summary?.totalCustomers || 0),
          totalOrders: Number(summaryRes.data?.summary?.totalOrders || 0),
          totalSales: Number(summaryRes.data?.summary?.totalSales || 0),
          grossSales: Number(summaryRes.data?.summary?.grossSales || 0),
          totalDiscounts: Number(summaryRes.data?.summary?.totalDiscounts || 0),
          totalDeliveryFees: Number(summaryRes.data?.summary?.totalDeliveryFees || 0),
          averageOrderValue: Number(summaryRes.data?.summary?.averageOrderValue || 0),
          activeCustomers: Number(summaryRes.data?.summary?.activeCustomers || 0),
          unassignedDeliveries: Number(summaryRes.data?.summary?.unassignedDeliveries || 0),
          scheduledDeliveries: Number(summaryRes.data?.summary?.scheduledDeliveries || 0),
          outForDelivery: Number(summaryRes.data?.summary?.outForDelivery || 0),
          pendingDeliveries: Number(summaryRes.data?.summary?.pendingDeliveries || 0),
          deliveredOrders: Number(summaryRes.data?.summary?.deliveredOrders || 0),
          failedDeliveries: Number(summaryRes.data?.summary?.failedDeliveries || 0),
          cancelledOrders: Number(summaryRes.data?.summary?.cancelledOrders || 0),
          totalUnitsSold: Number(summaryRes.data?.summary?.totalUnitsSold || 0),
        });

        const normalizedTrends = ((summaryRes.data?.monthlyTrends || []) as Array<{
          month?: string;
          revenue?: number | string;
          orders?: number | string;
        }>).map((entry) => ({
          month: monthLabel(String(entry.month || 'N/A')),
          revenue: Number(entry.revenue || 0),
          orders: Number(entry.orders || 0),
        }));
        setTrendData(normalizedTrends);

        const normalizedTopProducts = ((summaryRes.data?.topProducts || []) as Array<{
          product_name?: string;
          sold_quantity?: number | string;
          revenue?: number | string;
        }>).map((entry) => ({
          product_name: String(entry.product_name || 'Unknown Product'),
          sold_quantity: Number(entry.sold_quantity || 0),
          revenue: Number(entry.revenue || 0),
        }));
        setTopProducts(normalizedTopProducts);

        const normalizedRecentOrders = ((recentOrdersRes.data?.data || []) as Order[])
          .slice(0, 8)
          .map((order) => ({
            order_id: order.order_id,
            customer_name: order.customer_name || `Customer #${order.customer_id}`,
            delivery_date: order.delivery_date,
            total_amount: Number(order.total_amount || 0),
            delivery_status: order.delivery_status,
          }));
        setRecentOrders(normalizedRecentOrders);

        const previousSummary = previousSummaryRes?.data?.summary;
        if (previousSummary) {
          const currentDeliveryRate = summaryRes.data?.summary?.totalOrders
            ? (Number(summaryRes.data.summary.deliveredOrders || 0) / Number(summaryRes.data.summary.totalOrders || 0)) * 100
            : 0;
          const previousDeliveryRate = Number(previousSummary.totalOrders || 0)
            ? (Number(previousSummary.deliveredOrders || 0) / Number(previousSummary.totalOrders || 0)) * 100
            : 0;

          setReportDelta({
            salesDeltaPct: percentageDelta(
              Number(summaryRes.data?.summary?.totalSales || 0),
              Number(previousSummary.totalSales || 0),
            ),
            ordersDeltaPct: percentageDelta(
              Number(summaryRes.data?.summary?.totalOrders || 0),
              Number(previousSummary.totalOrders || 0),
            ),
            deliveryRateDeltaPct: percentageDelta(currentDeliveryRate, previousDeliveryRate),
          });
        } else {
          setReportDelta({
            salesDeltaPct: null,
            ordersDeltaPct: null,
            deliveryRateDeltaPct: null,
          });
        }

        setLastUpdated(new Date());
      } catch (fetchError) {
        devError('[ANALYTICS] Failed to load analytics report.', fetchError);
        setError(resolveApiErrorMessage(fetchError, 'Failed to load analytics report.'));
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [rangeParams, previousRangeParams]);

  const rangeLabel = useMemo(
    () => RANGE_OPTIONS.find((option) => option.value === range)?.label || 'Custom Range',
    [range],
  );

  const deliveryMix = useMemo(
    () => [
      { name: 'Delivered', value: summary.deliveredOrders },
      { name: 'Pending', value: summary.scheduledDeliveries },
      { name: 'Out for Delivery', value: summary.outForDelivery },
      { name: 'Unassigned', value: summary.unassignedDeliveries },
      { name: 'Failed', value: summary.failedDeliveries },
      { name: 'Cancelled', value: summary.cancelledOrders },
    ],
    [summary],
  );

  const productChartData = useMemo(
    () => topProducts.map((entry) => ({
      name: entry.product_name,
      units: entry.sold_quantity,
      revenue: entry.revenue,
    })),
    [topProducts],
  );

  const conversionRate = useMemo(() => {
    if (!summary.totalOrders) {
      return 0;
    }

    return (summary.deliveredOrders / summary.totalOrders) * 100;
  }, [summary]);

  const topProductRevenueShare = useMemo(() => {
    if (!summary.totalSales || !topProducts.length) {
      return 0;
    }

    const topRevenue = topProducts.reduce((sum, item) => sum + item.revenue, 0);
    return (topRevenue / summary.totalSales) * 100;
  }, [summary, topProducts]);

  const savePdf = async () => {
    if (!reportRef.current || exporting) {
      return;
    }

    setExporting(true);

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#f3f4ef',
      });

      const image = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imageWidth = pageWidth;
      const imageHeight = (canvas.height * imageWidth) / canvas.width;
      let remainingHeight = imageHeight;
      let yOffset = 0;

      pdf.addImage(image, 'PNG', 0, yOffset, imageWidth, imageHeight);
      remainingHeight -= pageHeight;

      // Add more pages when report content is taller than one A4 page.
      while (remainingHeight > 0) {
        yOffset = remainingHeight - imageHeight;
        pdf.addPage();
        pdf.addImage(image, 'PNG', 0, yOffset, imageWidth, imageHeight);
        remainingHeight -= pageHeight;
      }

      const timestamp = new Date().toISOString().slice(0, 10);
      pdf.save(`analytics-report-${timestamp}.pdf`);
    } catch (pdfError) {
      setError(resolveApiErrorMessage(pdfError, 'Failed to save PDF report.'));
    } finally {
      setExporting(false);
    }
  };

  const rangeFilterLabelId = 'analytics-range-filter-label';

  return (
    <div className="container analytics-page">
      <section className="header-row page-shell-header analytics-header" aria-label="Analytics report header">
        <div className="page-shell-heading analytics-header-copy">
          <p className="page-shell-kicker">Analytics</p>
          <h2>Business Intelligence Report</h2>
          <p className="page-shell-subtitle analytics-subtitle">
            Performance snapshot covering revenue, delivery execution, and product momentum.
            This report is export-ready for management review.
          </p>
        </div>

        <div className="analytics-actions page-shell-controls">
          <div className="analytics-filter-group filter-inline-control">
            <label id={rangeFilterLabelId} className="filter-inline-label">Reporting Window</label>
            <FilterDropdown
              id="analytics-range-filter"
              className="analytics-range-dropdown filter-inline-dropdown"
              ariaLabelledBy={rangeFilterLabelId}
              value={range}
              options={RANGE_OPTIONS}
              onChange={setRange}
              disabled={loading || exporting}
            />
          </div>

          <button
            type="button"
            className="analytics-save-pdf-btn"
            onClick={savePdf}
            disabled={loading || exporting}
          >
            {exporting ? 'Preparing PDF...' : 'Save PDF Report'}
          </button>
        </div>
      </section>

      {error && <Notification message={error} type="error" />}

      {loading ? (
        <PageLoader pageName="Analytics Report" className="analytics-loading-shell" />
      ) : (
        <div ref={reportRef} className="analytics-report-canvas" aria-label="Analytics report">
          <section className="analytics-report-meta">
            <div>
              <h3>Executive Summary</h3>
              <p>Reporting Window: <strong>{rangeLabel}</strong></p>
            </div>

            <p className="analytics-last-updated">
              Last Updated: {lastUpdated ? lastUpdated.toLocaleString() : 'N/A'}
            </p>
          </section>

          <section className="analytics-comparison-grid" aria-label="Period comparison metrics">
            <article className="analytics-comparison-card">
              <h4>Sales vs Previous Period</h4>
              <p>{formatDelta(reportDelta.salesDeltaPct)}</p>
            </article>
            <article className="analytics-comparison-card">
              <h4>Order Volume vs Previous Period</h4>
              <p>{formatDelta(reportDelta.ordersDeltaPct)}</p>
            </article>
            <article className="analytics-comparison-card">
              <h4>Delivery Rate vs Previous Period</h4>
              <p>{formatDelta(reportDelta.deliveryRateDeltaPct)}</p>
            </article>
          </section>

          <section className="analytics-kpi-grid" aria-label="Sales and operations KPIs">
            <article className="analytics-kpi-card tone-strong">
              <h4>Total Net Sales</h4>
              <p>{formatPeso(summary.totalSales)}</p>
            </article>
            <article className="analytics-kpi-card tone-strong">
              <h4>Gross Sales</h4>
              <p>{formatPeso(summary.grossSales)}</p>
            </article>
            <article className="analytics-kpi-card tone-soft">
              <h4>Average Order Value</h4>
              <p>{formatPeso(summary.averageOrderValue)}</p>
            </article>
            <article className="analytics-kpi-card tone-soft">
              <h4>Total Orders</h4>
              <p>{summary.totalOrders}</p>
            </article>
            <article className="analytics-kpi-card tone-soft">
              <h4>Units Sold</h4>
              <p>{summary.totalUnitsSold}</p>
            </article>
            <article className="analytics-kpi-card tone-soft">
              <h4>Active Customers</h4>
              <p>{summary.activeCustomers}</p>
            </article>
          </section>

          <section className="analytics-chart-grid">
            <article className="analytics-chart-card">
              <h3>Revenue and Order Velocity</h3>
              <div className="analytics-chart-frame">
                {trendData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={trendData} margin={{ top: 8, right: 6, left: -6, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#d2d8cf" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" allowDecimals={false} width={36} />
                      <YAxis yAxisId="right" orientation="right" width={44} />
                      <Tooltip
                        contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 8px 16px rgba(20, 38, 27, 0.12)' }}
                        formatter={(value: number | string, name: string) => (
                          name === 'revenue' ? formatPeso(Number(value || 0)) : Number(value || 0)
                        )}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="orders" name="orders" fill="#365a38" radius={[6, 6, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="revenue" name="revenue" stroke="#9a7b39" strokeWidth={3} dot={{ r: 3 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="analytics-empty">No trend data available for this period.</p>
                )}
              </div>
            </article>

            <article className="analytics-chart-card">
              <h3>Top Product Performance</h3>
              <div className="analytics-chart-frame">
                {productChartData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={productChartData}
                      layout="vertical"
                      margin={{ top: 8, left: 0, right: 6, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#d2d8cf" />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis type="category" dataKey="name" width={120} />
                      <Tooltip
                        contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 8px 16px rgba(20, 38, 27, 0.12)' }}
                        formatter={(value: number | string, name: string) => (
                          name === 'revenue' ? formatPeso(Number(value || 0)) : Number(value || 0)
                        )}
                      />
                      <Legend />
                      <Bar dataKey="units" name="units sold" fill="#456d3b" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="analytics-empty">No product sales data available.</p>
                )}
              </div>
            </article>

            <article className="analytics-chart-card">
              <h3>Delivery Distribution</h3>
              <div className="analytics-chart-frame pie-frame">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deliveryMix}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="46%"
                      outerRadius={82}
                      innerRadius={40}
                      paddingAngle={2}
                    >
                      {deliveryMix.map((entry, index) => {
                        const palette = ['#2f5736', '#6f7d48', '#8b6d33', '#486a72', '#a24b3e', '#5f6b68'];
                        return <Cell key={`${entry.name}-${index}`} fill={palette[index % palette.length]} />;
                      })}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 8px 16px rgba(20, 38, 27, 0.12)' }} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </article>
          </section>

          <section className="analytics-insights-grid">
            <article className="analytics-insight-card">
              <h4>Fulfillment Conversion</h4>
              <p>{conversionRate.toFixed(1)}%</p>
              <small>Delivered orders as a share of total orders.</small>
            </article>

            <article className="analytics-insight-card">
              <h4>Top Product Revenue Share</h4>
              <p>{topProductRevenueShare.toFixed(1)}%</p>
              <small>Revenue contribution of current top-selling products.</small>
            </article>

            <article className="analytics-insight-card">
              <h4>Backlog Pressure</h4>
              <p>{summary.pendingDeliveries}</p>
              <small>Orders currently waiting assignment or delivery completion.</small>
            </article>
          </section>

          <section className="analytics-narrative">
            <h3>Analyst Notes</h3>
            <ul>
              <li>Net sales reached {formatPeso(summary.totalSales)} in the selected period.</li>
              <li>
                Delivery performance shows {summary.deliveredOrders} completed orders against {summary.pendingDeliveries} in active backlog.
              </li>
              <li>
                Top products currently account for {topProductRevenueShare.toFixed(1)}% of net sales, indicating concentration risk and targeting opportunities.
              </li>
            </ul>
          </section>

          <section className="analytics-appendix" aria-label="Recent order appendix">
            <h3>Report Appendix: Recent Orders</h3>
            <DataTable wrapperClassName="analytics-appendix-table-wrapper" tableClassName="analytics-appendix-table">
                <thead>
                  <tr>
                    <th className="table-col-number">Order ID</th>
                    <th>Customer</th>
                    <th>Delivery Date</th>
                    <th className="table-col-number">Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.length ? recentOrders.map((order) => (
                    <tr key={order.order_id}>
                      <td className="table-col-number">
                        <span className="table-id-chip">#{order.order_id}</span>
                      </td>
                      <td>{order.customer_name}</td>
                      <td>{order.delivery_date ? formatDateOnly(order.delivery_date) : 'Not Scheduled'}</td>
                      <td className="table-col-number">{formatPeso(order.total_amount)}</td>
                      <td>
                        <span className={`delivery-status-pill status-${order.delivery_status || 'unassigned'}`}>
                          {normalizeDeliveryStatus(order.delivery_status)}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <DataTableEmptyState colSpan={5} message="No recent orders available." />
                  )}
                </tbody>
            </DataTable>
          </section>
        </div>
      )}
    </div>
  );
};

export default Analytics;
