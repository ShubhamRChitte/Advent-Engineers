import axios from 'axios';

const API_BASE_URL = ``;

export const accuracyLimitsApi = {
    getAllLimits: async () => {
        const response = await axios.get(`${API_BASE_URL}/accuracy-limits`, { withCredentials: true });
        return response.data;
    },

    getLimitsByType: async (coreType: 'metering' | 'protection' | 'ps') => {
        const response = await axios.get(`${API_BASE_URL}/accuracy-limits/${coreType}`, { withCredentials: true });
        return response.data;
    },

    updateLimit: async (limitData: any) => {
        const response = await axios.post(`${API_BASE_URL}/accuracy-limits`, limitData, { withCredentials: true });
        return response.data;
    },

    deleteLimit: async (id: string) => {
        const response = await axios.delete(`${API_BASE_URL}/accuracy-limits/${id}`, { withCredentials: true });
        return response.data;
    }
};
