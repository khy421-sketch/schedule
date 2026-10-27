import { User, Scheduler, Schedule, Invitation, SystemStats } from '../types';

const TOKEN_KEY = 'cozyschedule_token';

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setStoredToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearStoredToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(path, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = data?.error || '요청 처리 중 오류가 발생했습니다.';
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth
  getDemoUsers: () => request<{ demoUsers: User[] }>('/api/auth/demo-users'),
  demoLogin: async (username: string) => {
    const res = await request<{ token: string; user: User }>('/api/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
    if (res.token) {
      setStoredToken(res.token);
    }
    return res;
  },
  login: async (username: string, password: string) => {
    const res = await request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (res.token) {
      setStoredToken(res.token);
    }
    return res;
  },
  register: async (data: { username: string; password: string; name: string; avatar?: string }) => {
    const res = await request<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.token) {
      setStoredToken(res.token);
    }
    return res;
  },
  getMe: () => request<{ user: User }>('/api/auth/me'),
  updateProfile: (data: { name?: string; avatar?: string; password?: string }) =>
    request<{ user: User }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  searchUsers: (query: string) =>
    request<{ users: { id: string; username: string; name: string; avatar: string }[] }>(`/api/users/search?q=${encodeURIComponent(query)}`),

  // Schedulers
  getSchedulers: () => request<{ schedulers: Scheduler[] }>('/api/schedulers'),
  createScheduler: (data: { name: string; description?: string; icon?: string; color?: string }) =>
    request<{ scheduler: Scheduler }>('/api/schedulers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateScheduler: (id: string, data: { name?: string; description?: string; icon?: string; color?: string }) =>
    request<{ scheduler: Scheduler }>(`/api/schedulers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteScheduler: (id: string) =>
    request<{ message: string }>(`/api/schedulers/${id}`, {
      method: 'DELETE',
    }),
  inviteMember: (schedulerId: string, targetUsername: string, role: string = 'editor') =>
    request<{ invitation: Invitation; message: string }>(`/api/schedulers/${schedulerId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ targetUsername, role }),
    }),
  updateMemberRole: (schedulerId: string, userId: string, role: string) =>
    request<{ scheduler: Scheduler }>(`/api/schedulers/${schedulerId}/members/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),
  removeMember: (schedulerId: string, userId: string) =>
    request<{ message: string }>(`/api/schedulers/${schedulerId}/members/${userId}`, {
      method: 'DELETE',
    }),

  // Invitations
  getInvitations: () => request<{ invitations: Invitation[] }>('/api/invitations'),
  respondInvitation: (id: string, action: 'accept' | 'reject') =>
    request<{ message: string; invitation: Invitation }>(`/api/invitations/${id}/respond`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    }),

  // Schedules
  getSchedules: (schedulerIds?: string[]) => {
    const query = schedulerIds && schedulerIds.length > 0 ? `?schedulerIds=${schedulerIds.join(',')}` : '';
    return request<{ schedules: Schedule[] }>(`/api/schedules${query}`);
  },
  createSchedule: (scheduleData: Partial<Schedule>) =>
    request<{ schedule: Schedule }>('/api/schedules', {
      method: 'POST',
      body: JSON.stringify(scheduleData),
    }),
  updateSchedule: (id: string, scheduleData: Partial<Schedule>) =>
    request<{ schedule: Schedule }>(`/api/schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(scheduleData),
    }),
  deleteSchedule: (id: string) =>
    request<{ message: string }>(`/api/schedules/${id}`, {
      method: 'DELETE',
    }),

  // Admin
  getAdminStats: () => request<{ stats: SystemStats }>('/api/admin/stats'),
  getAdminUsers: () => request<{ users: (User & { ownedSchedulers: number; memberSchedulers: number; scheduleCount: number })[] }>('/api/admin/users'),
  updateAdminUser: (id: string, data: { role?: string; status?: string; newPassword?: string }) =>
    request<{ user: User; message: string }>(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteAdminUser: (id: string) =>
    request<{ message: string }>(`/api/admin/users/${id}`, {
      method: 'DELETE',
    }),
  getAdminSchedulers: () =>
    request<{ schedulers: (Scheduler & { owner_username?: string; owner_name?: string; schedule_count: number })[] }>('/api/admin/schedulers'),
  deleteAdminScheduler: (id: string) =>
    request<{ message: string }>(`/api/admin/schedulers/${id}`, {
      method: 'DELETE',
    }),
};
