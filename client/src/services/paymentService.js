import api from '../api/api';

const paymentService = {
    createPaymentUrl: async (packageId, multiplier = 1) => {
        const response = await api.post(
            `/payments/create/${packageId}?multiplier=${multiplier}`,
            {}
        );
        return response.data;
    },
    getMyTransactions: async () => {
        const response = await api.get('/payments/my');
        return response.data;
    }
};

export default paymentService;
