import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const packageService = {
    getAllPackages: async () => {
        const response = await axios.get(`${API_URL}/packages`);
        return response.data;
    },
    getPackageById: async (id) => {
        const response = await axios.get(`${API_URL}/packages/${id}`);
        return response.data;
    }
};

export default packageService;
