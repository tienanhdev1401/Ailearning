import { useMemo, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import {
  CUSTOMER_ACQUISITION_SERIES,
  DEFAULT_KPIS,
  DEFAULT_RECENT_REPORTS,
  DEFAULT_TOP_PRODUCTS,
  REGION_SALES_SERIES,
  REGIONS,
  REVENUE_TRENDS_SERIES,
  WEEK_DAYS
} from '../data/reports';
import { useToast } from '../../context/ToastContext';

const formatCurrency = (value) => `$${value.toLocaleString()}`;

const getRandomChange = (base, variance) => {
  const delta = Math.floor(Math.random() * variance) * (Math.random() > 0.5 ? 1 : -1);
  return Math.max(0, base + delta);
};

const ReportsPage = () => {
  const toast = useToast();
  const [dateRange, setDateRange] = useState('30d');
  const [reportType, setReportType] = useState('overview');
  const [exportFormat, setExportFormat] = useState('pdf');
  const [kpis, setKpis] = useState(DEFAULT_KPIS);
  const [recentReports, setRecentReports] = useState(DEFAULT_RECENT_REPORTS);
  const [topProducts] = useState(DEFAULT_TOP_PRODUCTS);

  const notify = (message) => {
    toast.info(message);
  };

  const randomizeKpis = () => {
    setKpis((prev) => ({
      revenue: getRandomChange(prev.revenue, 15000),
      revenueChange: Number((Math.random() * 15).toFixed(1)),
      orders: getRandomChange(prev.orders, 250),
      ordersChange: Number((Math.random() * 10).toFixed(1)),
      customers: getRandomChange(prev.customers, 150),
      customersChange: Number((Math.random() * 20).toFixed(1)),
      conversionRate: Number((Math.random() * 4 + 2).toFixed(1)),
      conversionChange: Number((Math.random() * 1 - 0.5).toFixed(1))
    }));
  };

  const handleApplyFilters = () => {
    randomizeKpis();
    notify('Filters applied successfully!');
  };

  const handleScheduleReport = () => notify('Report scheduling modal would open here.');
  const handleGenerateReport = () => notify('New report generation would start here.');
  const handleExportData = () => notify(`Exporting data as ${reportType}_${Date.now()}.${exportFormat}`);
  const handleRefreshReports = () => notify('Reports list refreshed.');

  const handleDownloadReport = (report) => notify(`Downloading ${report.name}`);
  const handleShareReport = (report) => notify(`Share link for ${report.name} would open here.`);
  const handleDuplicateReport = (report) => {
    const duplicate = {
      ...report,
      id: `RPT-${Math.floor(Math.random() * 900 + 100)}`,
      name: `${report.name} (Copy)`,
      generated: new Date().toISOString().split('T')[0],
      status: 'ready'
    };
    setRecentReports((prev) => [duplicate, ...prev]);
    notify('Report duplicated successfully.');
  };
  const handleDeleteReport = async (report) => {
    const confirmed = await toast.confirm(`Delete ${report.name}?`, { type: 'danger', confirmText: 'Delete', cancelText: 'Cancel' });
    if (confirmed) {
      setRecentReports((prev) => prev.filter((item) => item.id !== report.id));
      notify('Report deleted.');
    }
  };

  const revenueChartOptions = useMemo(
    () => ({
      chart: { type: 'area', toolbar: { show: true } },
      colors: ['#6366f1', '#10b981'],
      stroke: { curve: 'smooth', width: 3 },
      fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.2 } },
      xaxis: { categories: WEEK_DAYS },
      yaxis: {
        title: { text: 'Amount ($)' },
        labels: { formatter: (value) => `$${value.toLocaleString()}` }
      },
      tooltip: { y: { formatter: (value) => `$${value.toLocaleString()}` } },
      legend: { position: 'top' }
    }),
    []
  );

  const topProductsChart = useMemo(
    () => ({
      options: {
        chart: { type: 'donut' },
        labels: topProducts.map((product) => product.name),
        colors: ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'],
        plotOptions: { pie: { donut: { size: '65%' } } },
        legend: { show: false },
        tooltip: { y: { formatter: (value) => `$${value}k revenue` } }
      },
      series: topProducts.map((product) => product.revenue)
    }),
    [topProducts]
  );

  const customerAcquisitionOptions = useMemo(
    () => ({
      chart: { type: 'bar', stacked: true },
      plotOptions: { bar: { columnWidth: '55%', borderRadius: 4 } },
      colors: ['#6366f1', '#e5e7eb'],
      xaxis: { categories: WEEK_DAYS },
      yaxis: { title: { text: 'Customers' } },
      legend: { position: 'top' }
    }),
    []
  );

  const regionSalesOptions = useMemo(
    () => ({
      chart: { type: 'radar' },
      colors: ['#6366f1'],
      xaxis: { categories: REGIONS },
      markers: { size: 4 },
      stroke: { width: 2 }
    }),
    []
  );

  const statusBadgeClass = (status) => {
    if (status === 'ready') return 'bg-success';
    if (status === 'generating') return 'bg-warning';
    return 'bg-danger';
  };

  return (
    <div className="reports-page container-fluid p-4 p-lg-5">
      <div className="d-flex justify-content-between align-items-center mb-4 mb-lg-5">
        <div>
          <h1 className="h3 mb-0">Reports &amp; Analytics</h1>
          <p className="text-muted mb-0">Generate insights and export business data</p>
        </div>
        <div className="d-flex gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={handleScheduleReport}>
            <i className="bi bi-calendar-plus me-2" />Schedule
          </button>
          <button type="button" className="btn btn-outline-secondary" onClick={handleExportData}>
            <i className="bi bi-download me-2" />Export
          </button>
          <button type="button" className="btn btn-primary" onClick={handleGenerateReport}>
            <i className="bi bi-plus-lg me-2" />New Report
          </button>
        </div>
      </div>

      <div className="report-filter">
        <div className="row g-3 align-items-end">
          <div className="col-md-3">
            <label className="form-label fw-medium" htmlFor="reportDateRange">
              Date Range
            </label>
            <select
              id="reportDateRange"
              className="form-select"
              value={dateRange}
              onChange={(event) => setDateRange(event.target.value)}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
              <option value="custom">Custom range</option>
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label fw-medium" htmlFor="reportType">
              Report Type
            </label>
            <select
              id="reportType"
              className="form-select"
              value={reportType}
              onChange={(event) => setReportType(event.target.value)}
            >
              <option value="overview">Business Overview</option>
              <option value="sales">Sales Analytics</option>
              <option value="inventory">Inventory Report</option>
              <option value="customers">Customer Insights</option>
              <option value="financial">Financial Summary</option>
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label fw-medium" htmlFor="exportFormat">
              Format
            </label>
            <select
              id="exportFormat"
              className="form-select"
              value={exportFormat}
              onChange={(event) => setExportFormat(event.target.value)}
            >
              <option value="pdf">PDF Report</option>
              <option value="excel">Excel Spreadsheet</option>
              <option value="csv">CSV Data</option>
              <option value="json">JSON Data</option>
            </select>
          </div>
          <div className="col-md-3">
            <button type="button" className="btn btn-primary w-100" onClick={handleApplyFilters}>
              <i className="bi bi-funnel me-2" />Apply Filters
            </button>
          </div>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="card stats-card">
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="text-muted mb-2">Total Revenue</h6>
                <div className="metric-value">{formatCurrency(kpis.revenue)}</div>
                <div className="metric-change positive">
                  <i className="bi bi-arrow-up" />
                  <span>+{kpis.revenueChange}%</span> vs last period
                </div>
              </div>
              <div className="stats-icon bg-success bg-opacity-10 text-success">
                <i className="bi bi-currency-dollar" />
              </div>
            </div>
          </div>
        </div>
        <div className="card stats-card">
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="text-muted mb-2">Orders</h6>
                <div className="metric-value">{kpis.orders.toLocaleString()}</div>
                <div className="metric-change positive">
                  <i className="bi bi-arrow-up" />
                  <span>+{kpis.ordersChange}%</span> vs last period
                </div>
              </div>
              <div className="stats-icon bg-primary bg-opacity-10 text-primary">
                <i className="bi bi-bag-check" />
              </div>
            </div>
          </div>
        </div>
        <div className="card stats-card">
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="text-muted mb-2">Customers</h6>
                <div className="metric-value">{kpis.customers.toLocaleString()}</div>
                <div className="metric-change positive">
                  <i className="bi bi-arrow-up" />
                  <span>+{kpis.customersChange}%</span> vs last period
                </div>
              </div>
              <div className="stats-icon bg-info bg-opacity-10 text-info">
                <i className="bi bi-people" />
              </div>
            </div>
          </div>
        </div>
        <div className="card stats-card">
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="text-muted mb-2">Conversion Rate</h6>
                <div className="metric-value">{kpis.conversionRate}%</div>
                <div className="metric-change neutral">
                  <i className="bi bi-dash" />
                  <span>{kpis.conversionChange}%</span> vs last period
                </div>
              </div>
              <div className="stats-icon bg-warning bg-opacity-10 text-warning">
                <i className="bi bi-graph-up-arrow" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 g-lg-5 mb-5">
        <div className="col-lg-8">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">Revenue Trends</h5>
              <div className="btn-group btn-group-sm" role="group">
                <button type="button" className="btn btn-outline-secondary active">
                  7D
                </button>
                <button type="button" className="btn btn-outline-secondary">30D</button>
                <button type="button" className="btn btn-outline-secondary">90D</button>
              </div>
            </div>
            <div className="card-body p-3 p-lg-4">
              <ReactApexChart options={revenueChartOptions} series={REVENUE_TRENDS_SERIES} height={350} type="area" />
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="card-title mb-0">Top Products</h5>
            </div>
            <div className="card-body p-3 p-lg-4">
              <ReactApexChart options={topProductsChart.options} series={topProductsChart.series} type="donut" height={220} />
              <div className="mt-3">
                {topProducts.map((product) => (
                  <div key={product.name} className="d-flex justify-content-between align-items-center mb-2">
                    <span className="small">{product.name}</span>
                    <div className="d-flex align-items-center">
                      <span className="small text-muted me-2">{`$${product.revenue}k`}</span>
                      <span className="small fw-medium">{product.units}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 g-lg-5 mb-5">
        <div className="col-lg-6">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="card-title mb-0">Customer Acquisition</h5>
            </div>
            <div className="card-body p-3 p-lg-4">
              <ReactApexChart options={customerAcquisitionOptions} series={CUSTOMER_ACQUISITION_SERIES} type="bar" height={260} />
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="card-title mb-0">Sales by Region</h5>
            </div>
            <div className="card-body p-3 p-lg-4">
              <ReactApexChart options={regionSalesOptions} series={REGION_SALES_SERIES} type="radar" height={260} />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="row align-items-center">
            <div className="col">
              <h5 className="card-title mb-0">Recent Reports</h5>
            </div>
            <div className="col-auto">
              <button type="button" className="btn btn-sm btn-outline-primary" onClick={handleRefreshReports}>
                <i className="bi bi-arrow-clockwise me-1" />Refresh
              </button>
            </div>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Report Name</th>
                  <th>Type</th>
                  <th>Date Range</th>
                  <th>Generated</th>
                  <th>Status</th>
                  <th style={{ width: 120 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentReports.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <div className="fw-medium">{report.name}</div>
                      <small className="text-muted">ID: {report.id}</small>
                    </td>
                    <td>
                      <span className="badge bg-secondary-subtle text-secondary-emphasis">{report.type}</span>
                    </td>
                    <td>{report.dateRange}</td>
                    <td>{report.generated}</td>
                    <td>
                      <span className={`badge ${statusBadgeClass(report.status)}`}>{report.status}</span>
                    </td>
                    <td>
                      <div className="dropdown">
                        <button type="button" className="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                          <i className="bi bi-three-dots" />
                        </button>
                        <ul className="dropdown-menu">
                          <li>
                            <button type="button" className="dropdown-item" onClick={() => handleDownloadReport(report)}>
                              <i className="bi bi-download me-2" />Download
                            </button>
                          </li>
                          <li>
                            <button type="button" className="dropdown-item" onClick={() => handleShareReport(report)}>
                              <i className="bi bi-share me-2" />Share
                            </button>
                          </li>
                          <li>
                            <button type="button" className="dropdown-item" onClick={() => handleDuplicateReport(report)}>
                              <i className="bi bi-copy me-2" />Duplicate
                            </button>
                          </li>
                          <li><hr className="dropdown-divider" /></li>
                          <li>
                            <button type="button" className="dropdown-item text-danger" onClick={() => handleDeleteReport(report)}>
                              <i className="bi bi-trash me-2" />Delete
                            </button>
                          </li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
