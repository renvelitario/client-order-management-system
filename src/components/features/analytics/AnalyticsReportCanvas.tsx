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
import DataTable, { DataTableEmptyState } from '../../ui/DataTable';
import { formatDateOnly, formatPeso } from '../../../utils/formatters';
import type {
  AnalyticsSummary,
  RecentOrder,
  ReportDelta,
  TrendPoint,
} from '../../../hooks/useAnalyticsReport';

type ChartProduct = {
  name: string;
  units: number;
  revenue: number;
};

type DeliveryMixEntry = {
  name: string;
  value: number;
};

type AnalyticsReportCanvasProps = {
  rangeLabel: string;
  lastUpdated: Date | null;
  reportDelta: ReportDelta;
  summary: AnalyticsSummary;
  trendData: TrendPoint[];
  recentOrders: RecentOrder[];
  deliveryMix: DeliveryMixEntry[];
  productChartData: ChartProduct[];
  conversionRate: number;
  topProductRevenueShare: number;
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

const AnalyticsReportCanvas = ({
  rangeLabel,
  lastUpdated,
  reportDelta,
  summary,
  trendData,
  recentOrders,
  deliveryMix,
  productChartData,
  conversionRate,
  topProductRevenueShare,
}: AnalyticsReportCanvasProps) => {
  return (
    <>
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
    </>
  );
};

export default AnalyticsReportCanvas;