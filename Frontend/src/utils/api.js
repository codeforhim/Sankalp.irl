import axios from 'axios';

// Create an Axios instance configured for our backend
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001', // Our Express.js backend URL
});

// Request Interceptor: Attach the JWT token to every request if it exists
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Handle global errors (like 401 Unauthorized)
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token expired or invalid, auto-logout (you could dispatch a logout event here)
            console.warn("Unauthorized API call. Token may have expired.");
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Redirect to login could be handled here or at the component level
        }
        return Promise.reject(error);
    }
);

export default api;
