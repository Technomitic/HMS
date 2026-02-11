import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Inject token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('medix_access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('medix_refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_BASE}/api/v1/auth/refresh`, {
          refreshToken,
        });

        localStorage.setItem('medix_access_token', data.accessToken);
        localStorage.setItem('medix_refresh_token', data.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem('medix_access_token');
        localStorage.removeItem('medix_refresh_token');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  },
);

// Typed API methods
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: any) => api.post('/auth/register', data),
  profile: () => api.get('/auth/profile'),
  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),
};

export const patientApi = {
  create: (data: any) => api.post('/patients', data),
  getMe: () => api.get('/patients/me'),
  getAll: (params?: any) => api.get('/patients', { params }),
  getById: (id: string) => api.get(`/patients/${id}`),
  update: (id: string, data: any) => api.put(`/patients/${id}`, data),
};

export const appointmentApi = {
  create: (data: any) => api.post('/appointments', data),
  getAll: (params?: any) => api.get('/appointments', { params }),
  getById: (id: string) => api.get(`/appointments/${id}`),
  getSlots: (doctorId: string, date: string) =>
    api.get(`/appointments/slots/${doctorId}`, { params: { date } }),
  getDoctorSchedule: (date: string) =>
    api.get('/appointments/doctor/schedule', { params: { date } }),
  updateStatus: (id: string, data: any) =>
    api.patch(`/appointments/${id}/status`, data),
  addClinicalNotes: (id: string, data: any) =>
    api.put(`/appointments/${id}/clinical-notes`, data),
  checkIn: (qrHash: string) => api.post(`/appointments/check-in/${qrHash}`),
};

export const doctorApi = {
  getAll: (params?: any) => api.get('/doctors', { params }),
  getById: (userId: string) => api.get(`/doctors/${userId}`),
};

export const labReportApi = {
  create: (data: any) => api.post('/lab-reports', data),
  getAll: (params?: any) => api.get('/lab-reports', { params }),
  getByPatient: (patientId: string, params?: any) =>
    api.get(`/lab-reports/patient/${patientId}`, { params }),
  getById: (id: string) => api.get(`/lab-reports/${id}`),
  updateStatus: (id: string, data: any) =>
    api.patch(`/lab-reports/${id}/status`, data),
};

export const billingApi = {
  create: (data: any) => api.post('/billing/invoices', data),
  getAll: (params?: any) => api.get('/billing/invoices', { params }),
  getById: (id: string) => api.get(`/billing/invoices/${id}`),
  markPaid: (id: string, paymentMethod: string) =>
    api.patch(`/billing/invoices/${id}/pay`, { paymentMethod }),
  getPatientSummary: (patientId: string) =>
    api.get(`/billing/summary/${patientId}`),
};

export const dashboardApi = {
  admin: () => api.get('/dashboard/admin'),
  doctor: () => api.get('/dashboard/doctor'),
  patient: () => api.get('/dashboard/patient'),
};

export const notificationApi = {
  getAll: (limit?: number) =>
    api.get('/notifications', { params: { limit } }),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
};