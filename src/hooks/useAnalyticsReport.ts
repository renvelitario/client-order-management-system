import { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import { getPresetRangeQuery, getPreviousPresetRangeQuery } from '../utils/dateRanges';
import { devError } from '../utils/devLogger';
import type { Order } from '../types/app';
import { resolveApiErrorMessage } from '../types/app';

export type AnalyticsRangeKey = 'this_month' | 'previous_month' | 'this_year' | 'all_time';

export type AnalyticsSummary = {
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

export type TopProduct = {
  product_name: string;
  sold_quantity: number;
  revenue: number;
};

export type TrendPoint = {
  month: string;
  revenue: number;
  orders: number;
};

export type ReportDelta = {
  salesDeltaPct: number | null;
  ordersDeltaPct: number | null;
  deliveryRateDeltaPct: number | null;
};

export type RecentOrder = Pick<Order, 'order_id' | 'customer_name' | 'delivery_date' | 'total_amount' | 'delivery_status'>;

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

export const useAnalyticsReport = () => {
  const [range, setRange] = useState<AnalyticsRangeKey>('this_month');
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
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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

  return {
    range,
    setRange,
    summary,
    trendData,
    topProducts,
    reportDelta,
    recentOrders,
    loading,
    error,
    setError,
    lastUpdated,
  };
};