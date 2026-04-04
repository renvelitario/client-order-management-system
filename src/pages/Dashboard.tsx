import { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import '../styles/shared/table-ui-core.css';
import '../styles/shared/feedback-ui-notification.css';
import '../styles/pages/dashboard.css';
import FilterDropdown from '../components/ui/FilterDropdown';
import { formatPeso } from '../utils/formatters';
import Notification from '../components/ui/Notification';
import DataTable, { DataTableEmptyState } from '../components/ui/DataTable';
import type { Order } from '../types/app';
import { resolveApiErrorMessage } from '../types/app';

type RangeKey = 'this_month' | 'previous_month' | 'this_year' | 'all_time';

type DashboardStats = {
  totalProducts: number;
  totalCustomers: number;
  totalOrders: number;
};

type TopProductEntry = {
  product: string;
  quantity: number;
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
    totalOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [lineData, setLineData] = useState<Array<{ label: string; value: number }>>([]);
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
        });

        const monthly = (summaryRes.data?.monthlyRevenue || []) as Array<{ month?: string; revenue?: number | string }>;
        setLineData(monthly.map((entry) => ({ label: String(entry.month || 'N/A'), value: Number(entry.revenue || 0) })));

        const top = (summaryRes.data?.topProducts || []) as Array<{ product_name?: string; sold_quantity?: number | string }>;
        setTopProducts(top.map((entry) => ({
          product: entry.product_name || 'N/A',
          quantity: Number(entry.sold_quantity || 0),
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

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">Loading...</div>
      </div>
    );
  }

  const topProductsChartData = topProducts.map((entry) => ({
    name: entry.product,
    value: entry.quantity,
  }));
  const pieColors = ['#2e7d32', '#43a047', '#66bb6a', '#a5d6a7', '#c8e6c9'];
  const rangeFilterLabelId = 'dashboard-range-filter-label';

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h2>Welcome, {username}</h2>
          <p className="dashboard-subtitle">Business overview and trend insights</p>
        </div>

        <div className="dashboard-filter-group filter-inline-control">
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
      </div>

      {error && <Notification message={error} type="error" />}

      <section className="kpi-grid">
        <article className="kpi-card kpi-good">
          <h4>Total Products</h4>
          <p>{stats.totalProducts}</p>
        </article>
        <article className="kpi-card kpi-good">
          <h4>Total Customers</h4>
          <p>{stats.totalCustomers}</p>
        </article>
        <article className="kpi-card kpi-good">
          <h4>Total Orders</h4>
          <p>{stats.totalOrders}</p>
        </article>
      </section>

      <section className="chart-grid">
        <article className="chart-card">
          <h3>Orders Over Time</h3>
          {lineData.length ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#2e7d32" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="chart-empty">No order trend data for this range.</p>
          )}
        </article>

        <article className="chart-card">
          <h3>Top-Selling Products</h3>
          {topProductsChartData.length ? (
            <div className="chart-container pie-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topProductsChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    outerRadius={72}
                    label
                  >
                    {topProductsChartData.map((entry, index) => (
                      <Cell key={`${entry.name}-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="chart-empty">No product sales data for this range.</p>
          )}
        </article>
      </section>

      <section className="recent-orders-section">
        <h3>Recent Orders</h3>
        <DataTable wrapperClassName="recent-orders-table-wrapper" tableClassName="recent-orders-table">
            <thead>
              <tr>
                <th className="table-col-number">Order ID</th>
                <th>Product Names</th>
                <th>Customer Name</th>
                <th className="table-col-number">Number of Items</th>
                <th className="table-col-number">Total Amount</th>
                <th>Order Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <tr key={order.order_id}>
                    <td className="table-col-number">{order.order_id}</td>
                    <td>{order.product_name}</td>
                    <td>{order.customer_name}</td>
                    <td className="table-col-number">{order.item_count}</td>
                    <td className="table-col-number">{formatPeso(order.total_amount || 0)}</td>
                    <td>{formatOrderDate(order.order_date)}</td>
                  </tr>
                ))
              ) : (
                <DataTableEmptyState colSpan={6} message="No recent orders found." />
              )}
            </tbody>
          </DataTable>
      </section>
    </div>
  );
};

export default Dashboard;



