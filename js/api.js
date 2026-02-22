// api.js - API Client using Axios
// FIXED: interceptor no longer redirects on admin API calls

const API_CONFIG = {
    BASE_URL: 'https://commodity-calculator-api.onrender.com'
};

axios.defaults.baseURL = API_CONFIG.BASE_URL;
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.timeout = 10000;

const TokenManager = {
    getAccessToken()  { return localStorage.getItem('access_token'); },
    getRefreshToken() { return localStorage.getItem('refresh_token'); },
    setTokens(accessToken, refreshToken) {
        localStorage.setItem('access_token', accessToken);
        if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
    },
    clearTokens() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
    },
    getUser()      { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null; },
    setUser(user)  { localStorage.setItem('user', JSON.stringify(user)); }
};

// Add token to every request
axios.interceptors.request.use(
    config => {
        const token = TokenManager.getAccessToken();
        if (token) config.headers.Authorization = `Bearer ${token}`;
        console.log('Request:', config.method.toUpperCase(), config.url);
        return config;
    },
    error => Promise.reject(error)
);

// Handle responses globally
// FIXED: skip redirect for /admin/ routes — admin.js handles those itself
axios.interceptors.response.use(
    response => {
        console.log('Response:', response.status, response.config.url);
        return response;
    },
    async error => {
        console.error('Response error:', error.response?.status, error.config?.url);

        const url = error.config?.url || '';

        // ── SKIP redirect for admin routes — admin.js handles errors itself ──
        if (url.includes('/admin/')) {
            return Promise.reject(error);
        }

        if (error.response && error.response.status === 401) {
            const originalRequest = error.config;

            if (originalRequest.url.includes('/auth/login') ||
                originalRequest.url.includes('/auth/register')) {
                return Promise.reject(error);
            }

            if (!originalRequest._retry) {
                originalRequest._retry = true;
                try {
                    const refreshToken = TokenManager.getRefreshToken();
                    if (refreshToken) {
                        const response = await axios.post('/auth/refresh', {}, {
                            headers: { 'Authorization': `Bearer ${refreshToken}` }
                        });
                        if (response.data.access_token) {
                            TokenManager.setTokens(response.data.access_token);
                            originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`;
                            return axios(originalRequest);
                        }
                    }
                } catch (refreshError) {
                    TokenManager.clearTokens();
                    window.location.href = 'login.html';
                    return Promise.reject(refreshError);
                }
            }

            TokenManager.clearTokens();
            window.location.href = 'login.html';
        }

        return Promise.reject(error);
    }
);

const API = {
    async register(email, password, displayName = '') {
        try {
            const response = await axios.post('/auth/register', { email, password, display_name: displayName });
            if (response.data.success && response.data.access_token) {
                TokenManager.setTokens(response.data.access_token, response.data.refresh_token);
                TokenManager.setUser(response.data.user);
            }
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Registration failed');
        }
    },

    async login(email, password) {
        try {
            const response = await axios.post('/auth/login', { email, password });
            if (response.data.success && response.data.access_token) {
                TokenManager.setTokens(response.data.access_token, response.data.refresh_token);
                TokenManager.setUser(response.data.user);
            }
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Login failed');
        }
    },

    async logout() {
        try { await axios.post('/auth/logout'); } catch (error) {}
        finally {
            TokenManager.clearTokens();
            window.location.href = 'login.html';
        }
    },

    async getProfile() {
        try {
            const response = await axios.get('/user/profile');
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to get profile');
        }
    },

    async updateProfile(displayName) {
        try {
            const response = await axios.put('/user/profile', { display_name: displayName });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to update profile');
        }
    },

    async updateSettings(defaultExpenses, fontSize) {
        try {
            const response = await axios.put('/user/settings', {
                default_expenses: parseFloat(defaultExpenses), font_size: fontSize
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to update settings');
        }
    },

    async deleteAccount() {
        try {
            const response = await axios.delete('/user/account');
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to delete account');
        }
    },

    async getCalculations(filters = {}) {
        try {
            const response = await axios.get('/calculations', { params: filters });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to get calculations');
        }
    },

    async saveCalculation(type, data, commodity = null) {
        try {
            const response = await axios.post('/calculations', { type, data, commodity });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to save calculation');
        }
    },

    async getCalculation(id) {
        try {
            const response = await axios.get(`/calculations/${id}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to get calculation');
        }
    },

    async deleteCalculation(id) {
        try {
            const response = await axios.delete(`/calculations/${id}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to delete calculation');
        }
    },

    async clearAllCalculations() {
        try {
            const response = await axios.delete('/calculations/clear');
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to clear calculations');
        }
    },

    isLoggedIn()     { return !!TokenManager.getAccessToken(); },
    getCurrentUser() { return TokenManager.getUser(); }
};

function requireAuth() {
    if (!API.isLoggedIn()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

function redirectIfLoggedIn() {
    if (API.isLoggedIn()) {
        window.location.href = 'index.html';
        return true;
    }
    return false;
}