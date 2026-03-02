import axios from 'axios';

const api = axios.create({
    baseURL: '/api/v1',
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000,
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export const customerAPI = {
    getAll: (params = {}) => api.get('/customers/', { params }),
    getById: (customerId) => api.get(`/customers/${customerId}`),
    getStats: () => api.get('/customers/stats/overview'),
    create: (data) => api.post('/customers/', data),
    update: (customerId, data) => api.put(`/customers/${customerId}`, data),
    delete: (customerId) => api.delete(`/customers/${customerId}`),
};

export const segmentationAPI = {
    predict: (data) => api.post('/segmentation/predict', data),
    predictBatch: (limit) => api.post('/segmentation/predict-batch', null, { params: { limit } }),
    getModelInfo: () => api.get('/segmentation/model-info'),
    getProfiles: () => api.get('/segmentation/segment-profiles'),
};

export default api;
