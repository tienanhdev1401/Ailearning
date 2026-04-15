import api from '../api/api';

const subscriptionService = {
    getMySubscriptions: async () => {
        const response = await api.get('/subscriptions/my');
        return response.data;
    }
};

export default subscriptionService;
