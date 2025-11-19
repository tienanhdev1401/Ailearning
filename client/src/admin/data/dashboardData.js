const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CUSTOMERS = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson', 'Emily Chen', 'Carlos Diaz'];
const STATUS_CONFIG = [
  { text: 'Completed', className: 'bg-success' },
  { text: 'Pending', className: 'bg-warning' },
  { text: 'Shipped', className: 'bg-info' },
  { text: 'Cancelled', className: 'bg-danger' }
];

export const activityFeed = [
  {
    icon: 'bi-person-plus',
    iconVariant: 'text-primary',
    bgClass: 'bg-primary',
    title: 'New user registered',
    time: '2 minutes ago'
  },
  {
    icon: 'bi-bag-check',
    iconVariant: 'text-success',
    bgClass: 'bg-success',
    title: 'Order #1234 completed',
    time: '5 minutes ago'
  },
  {
    icon: 'bi-exclamation-triangle',
    iconVariant: 'text-warning',
    bgClass: 'bg-warning',
    title: 'Server maintenance scheduled',
    time: '1 hour ago'
  }
];

export const generateStatsCards = () => ([
  {
    label: 'Total Users',
    value: 12426,
    delta: '+12.5%',
    deltaVariant: 'text-success',
    icon: 'bi-people',
    iconVariant: 'text-primary',
    bgClass: 'bg-primary'
  },
  {
    label: 'Revenue',
    value: 54320,
    prefix: '$',
    delta: '+8.2%',
    deltaVariant: 'text-success',
    icon: 'bi-graph-up',
    iconVariant: 'text-success',
    bgClass: 'bg-success'
  },
  {
    label: 'Orders',
    value: 1852,
    delta: '-2.1%',
    deltaVariant: 'text-danger',
    icon: 'bi-bag-check',
    iconVariant: 'text-warning',
    bgClass: 'bg-warning'
  },
  {
    label: 'Avg. Response',
    value: 2.3,
    suffix: 's',
    delta: '+5.4%',
    deltaVariant: 'text-success',
    icon: 'bi-clock-history',
    iconVariant: 'text-info',
    bgClass: 'bg-info'
  }
]);

export const generateRevenueSeries = () => MONTH_LABELS.map(label => ({
  label,
  revenue: Math.floor(Math.random() * 40000) + 15000,
  profit: Math.floor(Math.random() * 15000) + 5000
}));

export const generateUserGrowthSeries = () => Array.from({ length: 14 }).map((_, idx) => ({
  label: `Day ${idx + 1}`,
  value: Math.floor(Math.random() * 120) + 40
}));

export const generateOrderStatus = () => ({
  completed: 1245,
  processing: 156,
  pending: 87,
  cancelled: 23
});

export const generateRecentOrders = (length = 5) => Array.from({ length }).map(() => ({
  id: `#${Math.floor(Math.random() * 9000) + 1000}`,
  customer: CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)],
  amount: `$${(Math.random() * 500 + 50).toFixed(2)}`,
  status: STATUS_CONFIG[Math.floor(Math.random() * STATUS_CONFIG.length)],
  date: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 7).toLocaleDateString()
}));

export const salesByLocation = [
  { name: 'United States', value: 2822 },
  { name: 'Canada', value: 1432 },
  { name: 'United Kingdom', value: 980 },
  { name: 'Australia', value: 780 },
  { name: 'Germany', value: 650 },
  { name: 'Brazil', value: 450 },
  { name: 'India', value: 1800 },
  { name: 'China', value: 2100 },
  { name: 'Japan', value: 850 },
  { name: 'Russia', value: 550 }
];

export const storageUsage = {
  used: 76,
  total: 100
};
