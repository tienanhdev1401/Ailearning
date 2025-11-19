export const DEFAULT_KPIS = {
  revenue: 125750,
  revenueChange: 12.5,
  orders: 1247,
  ordersChange: 8.3,
  customers: 892,
  customersChange: 15.2,
  conversionRate: 3.4,
  conversionChange: -0.2
};

export const DEFAULT_TOP_PRODUCTS = [
  { name: 'iPhone 14 Pro', revenue: 45, units: '156 sold' },
  { name: 'MacBook Air M2', revenue: 38, units: '89 sold' },
  { name: 'Samsung Galaxy S24', revenue: 29, units: '134 sold' },
  { name: 'Tablet Pro 12.9"', revenue: 22, units: '67 sold' },
  { name: 'Wireless Headphones', revenue: 18, units: '245 sold' }
];

export const DEFAULT_RECENT_REPORTS = [
  {
    id: 'RPT-001',
    name: 'Monthly Sales Report',
    type: 'Sales',
    dateRange: 'Dec 1-31, 2024',
    generated: '2025-01-02',
    status: 'ready'
  },
  {
    id: 'RPT-002',
    name: 'Customer Analytics',
    type: 'Customer',
    dateRange: 'Q4 2024',
    generated: '2025-01-01',
    status: 'ready'
  },
  {
    id: 'RPT-003',
    name: 'Inventory Summary',
    type: 'Inventory',
    dateRange: 'Dec 2024',
    generated: '2024-12-31',
    status: 'ready'
  },
  {
    id: 'RPT-004',
    name: 'Financial Overview',
    type: 'Financial',
    dateRange: 'Jan 1-15, 2025',
    generated: '2025-01-16',
    status: 'generating'
  },
  {
    id: 'RPT-005',
    name: 'Product Performance',
    type: 'Product',
    dateRange: 'Last 90 days',
    generated: '2024-12-28',
    status: 'failed'
  }
];

export const REVENUE_TRENDS_SERIES = [
  { name: 'Revenue', data: [28000, 32000, 35000, 41000, 38000, 45000, 52000] },
  { name: 'Profit', data: [8400, 9600, 10500, 12300, 11400, 13500, 15600] }
];

export const CUSTOMER_ACQUISITION_SERIES = [
  { name: 'New Customers', data: [23, 31, 45, 38, 52, 41, 67] },
  { name: 'Returning Customers', data: [67, 58, 72, 83, 76, 89, 94] }
];

export const REGION_SALES_SERIES = [{ name: 'Sales', data: [44, 55, 41, 67, 22, 43] }];

export const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const REGIONS = ['North America', 'Europe', 'Asia', 'South America', 'Africa', 'Oceania'];
