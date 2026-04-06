import { useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import FilterDropdown from '../components/ui/FilterDropdown';
import Notification from '../components/ui/Notification';
import PageLoader from '../components/ui/PageLoader';
import { resolveApiErrorMessage } from '../types/app';
import AnalyticsReportCanvas from '../components/features/analytics/AnalyticsReportCanvas';
import {
  useAnalyticsReport,
  type AnalyticsRangeKey,
} from '../hooks/useAnalyticsReport';
import '../styles/shared/table-ui-core.css';
import '../styles/shared/table-ui-layout-controls.css';
import '../styles/pages/analytics.css';

const RANGE_OPTIONS: Array<{ value: AnalyticsRangeKey; label: string }> = [
  { value: 'this_month', label: 'This Month' },
  { value: 'previous_month', label: 'Previous Month' },
  { value: 'this_year', label: 'This Year' },
  { value: 'all_time', label: 'All Time' },
];

const Analytics = () => {
  const {
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
  } = useAnalyticsReport();
  const [exporting, setExporting] = useState(false);

  const reportRef = useRef<HTMLDivElement | null>(null);

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
          <AnalyticsReportCanvas
            rangeLabel={rangeLabel}
            lastUpdated={lastUpdated}
            reportDelta={reportDelta}
            summary={summary}
            trendData={trendData}
            recentOrders={recentOrders}
            deliveryMix={deliveryMix}
            productChartData={productChartData}
            conversionRate={conversionRate}
            topProductRevenueShare={topProductRevenueShare}
          />
        </div>
      )}
    </div>
  );
};

export default Analytics;
