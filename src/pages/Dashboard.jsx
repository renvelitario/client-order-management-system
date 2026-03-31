import { useEffect, useState } from 'react';
import api from '../utils/api';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
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
import '../styles/pages/dashboard.css';

const RECENT_ORDERS_LIMIT = 10;

const RANGE_OPTIONS = [
  { value: 'this_month', label: 'This Month' },
  { value: 'previous_month', label: 'Previous Month' },
  { value: 'this_year', label: 'This Year' },
  { value: 'all_time', label: 'All Time' },
];

const formatOrderDate = (value) => {
  if (!value) return 'N/A';

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return 'N/A';
  }

  return parsedDate.toLocaleString();
};

const getDateRange = (rangeKey) => {
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

const isWithinRange = (dateValue, rangeKey) => {
  const { start, end } = getDateRange(rangeKey);
  if (!start || !end) return true;

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed >= start && parsed <= end;
};

const buildOrderTrend = (orders) => {
  const totals = new Map();

  orders.forEach((order) => {
    const d = new Date(order.order_date);
    if (Number.isNaN(d.getTime())) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    totals.set(key, (totals.get(key) || 0) + 1);
  });

  const points = [...totals.entries()]
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
    .slice(-7)
    .map(([date, count]) => ({
      label: date.slice(5),
      value: count,
    }));

  return points;
};

const buildTopProducts = (orders, productNameById) => {
  const totals = new Map();

  orders.forEach((order) => {
    (order.items || []).forEach((item) => {
      const key = String(item.product_id);
      totals.set(key, (totals.get(key) || 0) + Number(item.quantity || 0));
    });
  });

  const ranked = [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([productId, qty]) => ({
      product: productNameById.get(productId) || `Product #${productId}`,
      quantity: qty,
    }));

  return ranked;
};

const Dashboard = () => {
  const [range, setRange] = useState('this_month');
  const [rawProducts, setRawProducts] = useState([]);
  const [rawCustomers, setRawCustomers] = useState([]);
  const [rawPurchases, setRawPurchases] = useState([]);
  const [rawOrders, setRawOrders] = useState([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    totalCustomers: 0,
    totalPurchases: 0,
    totalOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [barData, setBarData] = useState({ low: 0, out: 0, healthy: 0 });
  const [lineData, setLineData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setError('');
      try {
        const [productsRes, custRes, purchRes, ordersRes] = await Promise.all([
          api.get('/products'),
          api.get('/customers'),
          api.get('/purchases'),
          api.get('/orders')
        ]);

        setRawProducts(productsRes.data || []);
        setRawCustomers(custRes.data || []);
        setRawPurchases(purchRes.data || []);
        setRawOrders(ordersRes.data || []);
      } catch (error) {
        console.error("Dashboard fetch error", error);
        setError(error.response?.data?.error || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  useEffect(() => {
    const products = rawProducts;
    const customers = rawCustomers;
    const filteredPurchases = rawPurchases.filter((p) => isWithinRange(p.purchase_date, range));
    const filteredOrders = rawOrders.filter((o) => isWithinRange(o.order_date, range));

    const productNameById = new Map(products.map((product) => [String(product.product_id), product.product_name]));
    const customerNameById = new Map(customers.map((customer) => [Number(customer.customer_id), customer.name]));

    const lowStock = products.filter((p) => Number(p.quantity) > 0 && Number(p.quantity) <= 10).length;
    const outOfStock = products.filter((p) => Number(p.quantity) === 0).length;
    const healthyStock = products.filter((p) => Number(p.quantity) > 10).length;

    setStats({
      totalProducts: products.length,
      lowStockProducts: lowStock,
      outOfStockProducts: outOfStock,
      totalCustomers: customers.length,
      totalPurchases: filteredPurchases.length,
      totalOrders: filteredOrders.length,
    });

    setBarData({
      low: lowStock,
      out: outOfStock,
      healthy: healthyStock,
    });

    setLineData(buildOrderTrend(filteredOrders));
    setTopProducts(buildTopProducts(filteredOrders, productNameById));

    const latestOrders = [...filteredOrders]
      .sort((left, right) => new Date(right.order_date) - new Date(left.order_date))
      .slice(0, RECENT_ORDERS_LIMIT)
      .map((order) => {
        const productNames = (order.items || []).length
          ? (order.items || [])
            .map((item) => productNameById.get(String(item.product_id)) || `Product #${item.product_id}`)
            .join(', ')
          : 'N/A';

        const item_count = (order.items || []).length;

        return {
          ...order,
          product_name: productNames,
          customer_name: customerNameById.get(Number(order.customer_id)) || `Customer #${order.customer_id}`,
          item_count,
          total_amount: Number(order.total_amount || 0),
        };
      });

    setRecentOrders(latestOrders);
  }, [range, rawProducts, rawCustomers, rawPurchases, rawOrders]);

  if (loading) return <div className="dashboard-loading">Loading dashboard...</div>;

  const stockChartData = [
    { name: 'Low', value: barData.low },
    { name: 'Out', value: barData.out },
    { name: 'Healthy', value: barData.healthy },
  ];
  const topProductsChartData = topProducts.map((entry) => ({
    name: entry.product,
    value: entry.quantity,
  }));
  const pieColors = ['#2e7d32', '#43a047', '#66bb6a', '#a5d6a7', '#c8e6c9'];

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h2>Dashboard</h2>
          <p className="dashboard-subtitle">Business overview and trend insights</p>
        </div>

        <div className="dashboard-filter-group">
          <label htmlFor="range-filter">Date Range</label>
          <select
            id="range-filter"
            value={range}
            onChange={(e) => setRange(e.target.value)}
          >
            {RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="notification error">{error}</div>}

      <section className="kpi-grid">
        <article className="kpi-card kpi-good">
          <h4>Total Products</h4>
          <p>{stats.totalProducts}</p>
        </article>
        <article className="kpi-card kpi-warn">
          <h4>Low Stock Products</h4>
          <p>{stats.lowStockProducts}</p>
        </article>
        <article className="kpi-card kpi-warn">
          <h4>Out of Stock Products</h4>
          <p>{stats.outOfStockProducts}</p>
        </article>
        <article className="kpi-card kpi-good">
          <h4>Total Customers</h4>
          <p>{stats.totalCustomers}</p>
        </article>
        <article className="kpi-card kpi-good">
          <h4>Total Orders</h4>
          <p>{stats.totalOrders}</p>
        </article>
        <article className="kpi-card kpi-good">
          <h4>Total Purchases</h4>
          <p>{stats.totalPurchases}</p>
        </article>
      </section>

      <section className="chart-grid">
        <article className="chart-card">
          <h3>Product Stock Levels</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  <Cell fill="#ef5350" />
                  <Cell fill="#c62828" />
                  <Cell fill="#2e7d32" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

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
        <div className="recent-orders-table-wrapper">
          <table className="recent-orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Product Names</th>
                <th>Customer Name</th>
                <th>Number of Items</th>
                <th>Total Amount</th>
                <th>Order Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <tr key={order.order_id}>
                    <td>{order.order_id}</td>
                    <td>{order.product_name}</td>
                    <td>{order.customer_name}</td>
                    <td>{order.item_count}</td>
                    <td>${Number(order.total_amount || 0).toFixed(2)}</td>
                    <td>{formatOrderDate(order.order_date)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">No recent orders found for this range.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
