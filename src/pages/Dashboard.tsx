import { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ComposedChart,
  Line,
  Bar,
  BarChart,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import '../styles/shared/table-ui-core.css';
import '../styles/shared/feedback-ui-notification.css';
import '../styles/shared/table-ui-layout-controls.css';
import '../styles/pages/dashboard.css';
import FilterDropdown from '../components/ui/FilterDropdown';
import { formatDateOnly, formatPeso } from '../utils/formatters';
import Notification from '../components/ui/Notification';
import PageLoader from '../components/ui/PageLoader';
import DataTable, { DataTableEmptyState } from '../components/ui/DataTable';
import type { Order } from '../types/app';
import { resolveApiErrorMessage } from '../types/app';
import { DELIVERY_STATUS_LABELS } from '../types/delivery';
import type { DeliveryStatusKey } from '../types/delivery';

type RangeKey = 'this_month' | 'previous_month' | 'this_year' | 'all_time';

type DashboardStats = {
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

type TopProductEntry = {
  product: string;
  quantity: number;
  revenue: number;
};

type MonthlyTrend = {
  label: string;
  revenue: number;
  orders: number;
};

type RecentOrder = Order & {
  product_name: string;
  item_count: number;
};

const RANGE_OPTIONS: Array<{ value: RangeKey; label: string }> = [
  { value: 'this_month', label: 'This Month' },
  { value: 'previous_month', label: 'Previous Month' },
  { value: 'this_year', label: 'This Year' },
  { value: 'all_time', label: 'All Time' },
];

const formatOrderDate = (value: string | number | Date | null | undefined): string => {
  if (!value) return 'N/A';

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return 'N/A';
  }

  return parsedDate.toLocaleString();
};

const getDateRange = (rangeKey: RangeKey): { start: Date | null; end: Date | null } => {
  const now = new Date();
  if (rangeKey === 'all_time') return { start: null, end: null };

  if (rangeKey === 'this_month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }

  if (rangeKey === 'previous_month') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return { start, end };
  }

  const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  return { start, end };
};

const getRangeQuery = (rangeKey: RangeKey): Record<string, string> => {
  const { start, end } = getDateRange(rangeKey);
  if (!start || !end) {
    return {};
  }

  return {
    from: start.toISOString(),
    to: end.toISOString(),
  };
};

const Dashboard = () => {
  const [range, setRange] = useState<RangeKey>('this_month');
  const [username, setUsername] = useState('User');
  const [stats, setStats] = useState<DashboardStats>({
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
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [trendData, setTrendData] = useState<MonthlyTrend[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const rangeParams = useMemo(() => getRangeQuery(range), [range]);

  useEffect(() => {
    const fetchUser = async () => {
      setError('');
      try {
        const { data: authMeRes } = await api.get('/auth/me');
        setUsername((authMeRes?.username || authMeRes?.email || 'User').trim());
      } catch (error) {
        console.error("Dashboard fetch error", error);
        setError(resolveApiErrorMessage(error, 'Failed to load dashboard data.'));
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError('');

      try {
        const [summaryRes, recentOrdersRes] = await Promise.all([
          api.get('/dashboard/summary', { params: rangeParams }),
          api.get('/dashboard/recent-orders', { params: rangeParams }),
        ]);

        setStats({
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

        const monthlyTrends = (summaryRes.data?.monthlyTrends || []) as Array<{
          month?: string;
          revenue?: number | string;
          orders?: number | string;
        }>;

        if (monthlyTrends.length) {
          setTrendData(monthlyTrends.map((entry) => ({
            label: String(entry.month || 'N/A'),
            revenue: Number(entry.revenue || 0),
            orders: Number(entry.orders || 0),
          })));
        } else {
          const monthlyRevenue = (summaryRes.data?.monthlyRevenue || []) as Array<{ month?: string; revenue?: number | string }>;
          setTrendData(monthlyRevenue.map((entry) => ({
            label: String(entry.month || 'N/A'),
            revenue: Number(entry.revenue || 0),
            orders: 0,
          })));
        }

        const top = (summaryRes.data?.topProducts || []) as Array<{
          product_name?: string;
          sold_quantity?: number | string;
          revenue?: number | string;
        }>;
        setTopProducts(top.map((entry) => ({
          product: entry.product_name || 'N/A',
          quantity: Number(entry.sold_quantity || 0),
          revenue: Number(entry.revenue || 0),
        })));

        const latestOrders = ((recentOrdersRes.data?.data || []) as Order[]).map((order) => {
          const items = order.items || [];
          return {
          ...order,
          product_name: items.length
            ? items.map((item) => item.product_name || item.sku).join(', ')
            : 'N/A',
          item_count: items.length,
          total_amount: Number(order.total_amount || 0),
          };
        }) as RecentOrder[];

        setRecentOrders(latestOrders);
      } catch (fetchError) {
        console.error('Dashboard fetch error', fetchError);
        setError(resolveApiErrorMessage(fetchError, 'Failed to load dashboard data.'));
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [rangeParams]);

  const topProductsChartData = topProducts.map((entry) => ({
    name: entry.product,
    quantity: entry.quantity,
    revenue: entry.revenue,
  }));
  const pieColors = ['#2f5736', '#6f7d48', '#8b6d33', '#486a72', '#a24b3e', '#5f6b68'];
  const chartSeriesColors = {
    orders: '#5b685b',
    revenue: '#365a38',
    topProducts: '#456d3b',
  };
  const deliveryStatusColors: Record<string, string> = {
    Unassigned: '#73583f',
    Pending: '#7f6a2f',
    'Out for Delivery': '#486a72',
    Delivered: '#2f5736',
    Failed: '#a24b3e',
    Cancelled: '#5f6b68',
  };
  const deliveryStatusData = [
    { name: 'Unassigned', value: stats.unassignedDeliveries },
    { name: 'Pending', value: stats.scheduledDeliveries },
    { name: 'Out for Delivery', value: stats.outForDelivery },
    { name: 'Delivered', value: stats.deliveredOrders },
    { name: 'Failed', value: stats.failedDeliveries },
    { name: 'Cancelled', value: stats.cancelledOrders },
  ];
  const rangeFilterLabelId = 'dashboard-range-filter-label';

  return (
    <div className="dashboard-page">
      <section className="header-row page-shell-header dashboard-header" aria-label="Dashboard summary header">
        <div className="page-shell-heading">
          <p className="page-shell-kicker">Dashboard</p>
          <h2>Welcome, {username}</h2>
          <p className="page-shell-subtitle dashboard-subtitle">Business overview and trend insights</p>
        </div>

        <div className="dashboard-filter-group filter-inline-control page-shell-controls">
          <label id={rangeFilterLabelId} className="filter-inline-label">Date Range</label>
          <FilterDropdown
            id="range-filter"
            className="dashboard-range-dropdown filter-inline-dropdown"
            ariaLabelledBy={rangeFilterLabelId}
            value={range}
            options={RANGE_OPTIONS}
            onChange={setRange}
          />
        </div>
      </section>

      {error && <Notification message={error} type="error" />}

      {loading ? (
        <PageLoader className="dashboard-report-canvas" pageName="Dashboard" />
      ) : (
      <div className="dashboard-report-canvas" aria-label="Dashboard report content">

      <section className="kpi-section">
        <h3 className="kpi-section-title">Sales Overview</h3>
        <div className="kpi-grid kpi-grid-sales">
          <article className="kpi-card kpi-good">
            <h4>Total Sales</h4>
            <p>{formatPeso(stats.totalSales)}</p>
          </article>
          <article className="kpi-card kpi-good">
            <h4>Gross Sales</h4>
            <p>{formatPeso(stats.grossSales)}</p>
          </article>
          <article className="kpi-card kpi-good">
            <h4>Average Order Value</h4>
            <p>{formatPeso(stats.averageOrderValue)}</p>
          </article>
          <article className="kpi-card kpi-muted">
            <h4>Discounts</h4>
            <p>{formatPeso(stats.totalDiscounts)}</p>
          </article>
          <article className="kpi-card kpi-muted">
            <h4>Delivery Fees</h4>
            <p>{formatPeso(stats.totalDeliveryFees)}</p>
          </article>
        </div>
      </section>

      <section className="kpi-section">
        <h3 className="kpi-section-title">Orders and Catalog</h3>
        <div className="kpi-grid kpi-grid-ops">
          <article className="kpi-card kpi-good">
            <h4>Total Orders</h4>
            <p>{stats.totalOrders}</p>
          </article>
          <article className="kpi-card kpi-good">
            <h4>Units Sold</h4>
            <p>{stats.totalUnitsSold}</p>
          </article>
          <article className="kpi-card kpi-good">
            <h4>Active Customers</h4>
            <p>{stats.activeCustomers}</p>
          </article>
          <article className="kpi-card kpi-muted">
            <h4>Total Customers</h4>
            <p>{stats.totalCustomers}</p>
          </article>
          <article className="kpi-card kpi-muted">
            <h4>Total Products</h4>
            <p>{stats.totalProducts}</p>
          </article>
        </div>
      </section>

      <section className="kpi-section">
        <h3 className="kpi-section-title">Delivery Snapshot</h3>
        <div className="kpi-grid kpi-grid-delivery">
          <article className="kpi-card kpi-status-unassigned">
            <h4>Unassigned</h4>
            <p>{stats.unassignedDeliveries}</p>
          </article>
          <article className="kpi-card kpi-status-pending">
            <h4>Pending</h4>
            <p>{stats.scheduledDeliveries}</p>
          </article>
          <article className="kpi-card kpi-status-out-for-delivery">
            <h4>Out for Delivery</h4>
            <p>{stats.outForDelivery}</p>
          </article>
          <article className="kpi-card kpi-status-delivered">
            <h4>Delivered</h4>
            <p>{stats.deliveredOrders}</p>
          </article>
          <article className="kpi-card kpi-status-failed">
            <h4>Failed</h4>
            <p>{stats.failedDeliveries}</p>
          </article>
          <article className="kpi-card kpi-status-cancelled">
            <h4>Cancelled</h4>
            <p>{stats.cancelledOrders}</p>
          </article>
        </div>
      </section>

      <section className="chart-grid">
        <article className="chart-card">
          <h3>Revenue vs Orders Trend</h3>
          {trendData.length ? (
            <div className="chart-container">
              <div className="chart-surface">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trendData} margin={{ top: 8, right: 6, left: -6, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" />
                  <YAxis yAxisId="left" allowDecimals={false} width={34} />
                  <YAxis yAxisId="right" orientation="right" width={42} />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 8px 16px rgba(15, 23, 42, 0.12)' }}
                    formatter={(value: number | string, name: string) => (
                      name === 'revenue' ? formatPeso(Number(value || 0)) : Number(value || 0)
                    )}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="orders" name="orders" fill={chartSeriesColors.orders} radius={[6, 6, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" name="revenue" stroke={chartSeriesColors.revenue} strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <p className="chart-empty">No order trend data for this range.</p>
          )}
        </article>

        <article className="chart-card">
          <h3>Top-Selling Products (Units)</h3>
          {topProductsChartData.length ? (
            <div className="chart-container">
              <div className="chart-surface">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProductsChartData} layout="vertical" margin={{ top: 8, left: 0, right: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={108} />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 8px 16px rgba(15, 23, 42, 0.12)' }}
                    formatter={(value: number | string, name: string) => (
                      name === 'revenue' ? formatPeso(Number(value || 0)) : Number(value || 0)
                    )}
                  />
                  <Legend />
                  <Bar dataKey="quantity" name="units sold" fill={chartSeriesColors.topProducts} radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <p className="chart-empty">No product sales data for this range.</p>
          )}
        </article>

        <article className="chart-card">
          <h3>Delivery Outcomes</h3>
          {deliveryStatusData.length ? (
            <div className="chart-container pie-chart-container">
              <div className="chart-surface">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deliveryStatusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      outerRadius={82}
                      innerRadius={42}
                      paddingAngle={2}
                      cornerRadius={4}
                    >
                      {deliveryStatusData.map((entry, index) => (
                        <Cell key={`${entry.name}-${index}`} fill={deliveryStatusColors[entry.name] || pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 8px 16px rgba(15, 23, 42, 0.12)' }} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <p className="chart-empty">No delivery status data for this range.</p>
          )}
        </article>
      </section>

      <section className="recent-orders-section">
        <h3>Recent Orders</h3>
        <DataTable wrapperClassName="recent-orders-table-wrapper" tableClassName="recent-orders-table">
            <thead>
              <tr>
                <th className="table-col-number">Order</th>
                <th>Customer</th>
                <th>Delivery Date</th>
                <th className="table-col-number">Items</th>
                <th className="table-col-number">Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <tr key={order.order_id} className="order-row-clickable">
                    <td className="table-col-number">
                      <span className="table-id-chip">#{order.order_id}</span>
                    </td>
                    <td>{order.customer_name}</td>
                    <td>{order.delivery_date ? formatDateOnly(order.delivery_date) : 'Not Scheduled'}</td>
                    <td className="table-col-number">{order.item_count}</td>
                    <td className="table-col-number">{formatPeso(order.total_amount || 0)}</td>
                    <td>
                      <span className={`delivery-status-pill status-${order.delivery_status || 'unassigned'}`}>
                        {DELIVERY_STATUS_LABELS[(order.delivery_status || 'unassigned') as DeliveryStatusKey] || 'Unassigned'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <DataTableEmptyState colSpan={6} message="No recent orders found." />
              )}
            </tbody>
          </DataTable>
      </section>
      </div>
      )}
    </div>
  );
};

export default Dashboard;



