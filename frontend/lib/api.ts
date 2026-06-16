const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// --- Get token from localStorage ---
const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

// --- Base fetch with auth ---
const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/auth/login';
    throw new Error('Unauthorized');
  }

  return response;
};

// --- AUTH ---
export const authAPI = {
  register: async (fullName: string, email: string, password: string) => {
    const res = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        full_name: fullName,
        email,
        password,
      }),
    });
    return res.json();
  },

  login: async (email: string, password: string) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);

    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      body: formData,
    });
    return res.json();
  },

  me: async () => {
    const res = await apiFetch('/auth/me');
    return res.json();
  },

  logout: async () => {
    const res = await apiFetch('/auth/logout', { method: 'POST' });
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return res.json();
  },
};

// --- SIGNALS ---
export const signalsAPI = {
  getCrypto: async (live: boolean = false) => {
    const res = await apiFetch(`/signals/crypto?live=${live}`);
    return res.json();
  },

  getForex: async (live: boolean = false) => {
    const res = await apiFetch(`/signals/forex?live=${live}`);
    return res.json();
  },

  getSports: async (live: boolean = false) => {
    const res = await apiFetch(`/signals/sports?live=${live}`);
    return res.json();
  },
};

// --- SUBSCRIPTIONS ---
export const subscriptionsAPI = {
  getPlans: async () => {
    const res = await apiFetch('/subscriptions/plans');
    return res.json();
  },

  getMySubscription: async () => {
    const res = await apiFetch('/subscriptions/me');
    return res.json();
  },

  subscribe: async (plan: string, billingCycle: string) => {
    const res = await apiFetch('/subscriptions/subscribe', {
      method: 'POST',
      body: JSON.stringify({
        plan,
        billing_cycle: billingCycle,
      }),
    });
    return res.json();
  },

  cancel: async () => {
    const res = await apiFetch('/subscriptions/cancel', {
      method: 'POST',
      body: JSON.stringify({ reason: 'User requested cancellation' }),
    });
    return res.json();
  },
};

// --- USERS ---
export const usersAPI = {
  getProfile: async () => {
    const res = await apiFetch('/users/me');
    return res.json();
  },

  updateProfile: async (fullName: string, email: string) => {
    const res = await apiFetch('/users/me', {
      method: 'PUT',
      body: JSON.stringify({ full_name: fullName, email }),
    });
    return res.json();
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const res = await apiFetch('/users/me/password', {
      method: 'PUT',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });
    return res.json();
  },
};
