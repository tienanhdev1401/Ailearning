import api from '../../api/api';

const dashboardService = {
  async getOverview() {
    const response = await api.get('/dashboard/overview');
    return response.data;
  },
  async getTransactions() {
    const response = await api.get('/dashboard/transactions');
    return response.data;
  },
  async getSubscriptions() {
    const response = await api.get('/dashboard/subscriptions');
    return response.data;
  },
  async getTopCustomers() {
    const response = await api.get('/dashboard/top-customers');
    return response.data;
  }
};

export default dashboardService;