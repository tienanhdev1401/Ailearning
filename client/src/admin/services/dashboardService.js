import api from '../../api/api';

const dashboardService = {
  async getOverview() {
    const response = await api.get('/dashboard/overview');
    return response.data;
  }
};

export default dashboardService;