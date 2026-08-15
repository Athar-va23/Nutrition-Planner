import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    const isAuthRoute =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register') ||
      originalRequest?.url?.includes('/auth/refresh') ||
      originalRequest?.url?.includes('/auth/logout');

    if (error.response?.status === 401 && !isAuthRoute && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data.tokens;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        // Clear tokens and redirect to login only if not already on login page
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    api.post('/auth/register', data),
  
  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),
};

// User API
export const userApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: any) => api.put('/users/profile', data),
  getPreferences: () => api.get('/users/preferences'),
  updatePreferences: (data: any) => api.put('/users/preferences', data),
};

// Meal Plan API
export const mealPlanApi = {
  list: (params?: { page?: number; limit?: number }) =>
    api.get('/meal-plans', { params }),
  get: (id: string) => api.get(`/meal-plans/${id}`),
  create: (data: any) => api.post('/meal-plans', data),
  delete: (id: string) => api.delete(`/meal-plans/${id}`),
};

// Recipe API
export const recipeApi = {
  generate: (ingredients: string[], preferences?: any) =>
    api.post('/recipes/generate', { ingredients, preferences }),
  search: (params?: { q?: string; cuisine?: string; page?: number; limit?: number }) =>
    api.get('/recipes/search', { params }),
};

// Grocery List API
export const groceryApi = {
  list: () => api.get('/grocery-lists'),
  get: (id: string) => api.get(`/grocery-lists/${id}`),
  generate: (mealPlanId: string, options?: any) =>
    api.post('/grocery-lists/generate', { mealPlanId, options }),
  updateItem: (listId: string, itemId: string, checked: boolean) =>
    api.patch(`/grocery-lists/${listId}/items/${itemId}`, { checked }),
  delete: (id: string) => api.delete(`/grocery-lists/${id}`),
};

// Image API
export const imageApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/images/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  detectIngredients: (imageUrl: string, confidenceThreshold?: number) =>
    api.post('/images/detect', { imageUrl, confidenceThreshold }),
};

// AI Assistant API
export const aiApi = {
  chat: (message: string, history: { role: string; content: string }[] = []) =>
    api.post('/ai/chat', { message, history }),
  getInsights: () => api.get('/ai/insights'),
};
