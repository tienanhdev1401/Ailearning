import api from '../api/api';

const packageService = {
    getAllPackages: async () => {
        const response = await api.get('/packages');
        return response.data;
    },
    getPackageById: async (id) => {
        const response = await api.get(`/packages/${id}`);
        return response.data;
    }
};

export default packageService;
