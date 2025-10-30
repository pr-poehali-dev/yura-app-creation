const AUTH_URL = 'https://functions.poehali.dev/0f238d18-0eb0-46f8-a5a8-2b97fa7dd386';

export interface User {
  id: number;
  email: string;
  full_name: string | null;
  role: string;
  telegram_id: number | null;
  telegram_username: string | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const authApi = {
  async register(email: string, password: string, full_name: string, phone: string): Promise<AuthResponse> {
    const response = await fetch(`${AUTH_URL}?path=/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name, phone })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }
    
    const data = await response.json();
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${AUTH_URL}?path=/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }
    
    const data = await response.json();
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  async verify(): Promise<User> {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('No token');
    
    const response = await fetch(`${AUTH_URL}?path=/verify`, {
      method: 'GET',
      headers: { 'X-Auth-Token': token }
    });
    
    if (!response.ok) {
      this.logout();
      throw new Error('Token invalid');
    }
    
    const data = await response.json();
    return data.user;
  },

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },

  getUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
};
