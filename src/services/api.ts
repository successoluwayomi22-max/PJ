/**
 * Client-Side API Service
 * Interacts with persistent server endpoints (/api/*)
 */

import { NewsPost, SiteSettings, User, RoleDefinition } from '../types';

const TOKEN_KEY = 'pulse_auth_token_v2';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // ignore
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
    credentials: 'include', // for HttpOnly session cookie
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data as T;
}

export const api = {
  // Authentication
  async login(identifier: string, password: string): Promise<{ user: User; token: string; role: RoleDefinition }> {
    const res = await request<{ user: User; token: string; role: RoleDefinition }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    if (res.token) setStoredToken(res.token);
    return res;
  },

  async register(payload: {
    displayName: string;
    username: string;
    email: string;
    password: string;
    role?: 'journalist' | 'reader';
    avatarUrl?: string;
    bio?: string;
    location?: string;
  }): Promise<{ user: User; token: string; role: RoleDefinition }> {
    const res = await request<{ user: User; token: string; role: RoleDefinition }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.token) setStoredToken(res.token);
    return res;
  },

  async getMe(): Promise<{ user: User; role: RoleDefinition; permissions: string[] } | null> {
    try {
      return await request<{ user: User; role: RoleDefinition; permissions: string[] }>('/api/auth/me');
    } catch {
      setStoredToken(null);
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } finally {
      setStoredToken(null);
    }
  },

  async logoutAll(): Promise<void> {
    try {
      await request('/api/auth/logout-all', { method: 'POST' });
    } finally {
      setStoredToken(null);
    }
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  async deleteAccount(password: string): Promise<{ success: boolean; message: string }> {
    const res = await request<{ success: boolean; message: string }>('/api/auth/delete-account', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
    setStoredToken(null);
    return res;
  },

  async bootstrap(payload: {
    displayName: string;
    username: string;
    email: string;
    password: string;
    bootstrapSecret?: string;
    avatarUrl?: string;
  }): Promise<{ user: User; token: string }> {
    const res = await request<{ user: User; token: string }>('/api/bootstrap', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.token) setStoredToken(res.token);
    return res;
  },

  async forgotPassword(identifier: string): Promise<{ success: boolean; message: string; devToken?: string }> {
    return request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ identifier }),
    });
  },

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  },

  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    return request('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  async uploadMedia(file: File): Promise<{ url: string; filename: string; size: number; mimeType: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const res = await request<{ url: string; filename: string; size: number; mimeType: string }>('/api/upload', {
            method: 'POST',
            body: JSON.stringify({
              data: reader.result as string,
              filename: file.name,
              mimeType: file.type,
            }),
          });
          resolve(res);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file for upload'));
      reader.readAsDataURL(file);
    });
  },

  // Articles & Content
  async getArticles(): Promise<{ articles: NewsPost[] }> {
    return request('/api/articles');
  },

  async createArticle(data: Partial<NewsPost>): Promise<{ success: boolean; postId: string; status: string }> {
    return request('/api/articles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateArticle(postId: string, data: Partial<NewsPost> & { changeSummary?: string }): Promise<{ success: boolean }> {
    return request(`/api/articles/${postId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async transitionWorkflow(postId: string, targetStatus: string): Promise<{ success: boolean; newStatus: string }> {
    return request(`/api/articles/${postId}/workflow`, {
      method: 'POST',
      body: JSON.stringify({ targetStatus }),
    });
  },

  // Interactions
  async toggleFollow(targetUserId: string): Promise<{ success: boolean; isFollowing: boolean }> {
    return request('/api/follow', {
      method: 'POST',
      body: JSON.stringify({ targetUserId }),
    });
  },

  async toggleBookmark(postId: string): Promise<{ success: boolean; bookmarked: boolean }> {
    return request('/api/bookmarks', {
      method: 'POST',
      body: JSON.stringify({ postId }),
    });
  },

  async deleteComment(commentId: string): Promise<{ success: boolean }> {
    return request(`/api/comments/${commentId}`, {
      method: 'DELETE',
    });
  },

  // Platform Data
  async getUsers(): Promise<{ users: User[] }> {
    return request('/api/users');
  },

  async getSettings(): Promise<{ settings: SiteSettings }> {
    return request('/api/settings');
  },

  async getAuditLogs(): Promise<{ logs: any[] }> {
    return request('/api/audit-logs');
  },
};
