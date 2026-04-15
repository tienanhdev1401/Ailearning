import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const paymentService = {
    createPaymentUrl: async (packageId) => {
        const token = localStorage.getItem('accessToken');
        const response = await axios.post(
            `${API_URL}/payments/create/${packageId}`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        return response.data;
    }
};

export default paymentService;
