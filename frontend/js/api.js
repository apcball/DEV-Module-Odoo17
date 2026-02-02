/**
 * IT Ticket Request - API Service
 * Handles all backend API communications
 */

const API_BASE_URL = 'http://localhost:3000/api';

// Utility: Get auth token from localStorage
function getAuthToken() {
  return localStorage.getItem('token');
}

// Utility: Get auth headers
function getAuthHeaders() {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
}

// Utility: Handle API response
async function handleResponse(response) {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || data.error || 'Something went wrong');
  }
  
  return data;
}

// ============ AUTH API ============
const AuthAPI = {
  // Register new user
  async register(userData) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return handleResponse(response);
  },

  // Login
  async login(credentials) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return handleResponse(response);
  },

  // Get current user
  async getMe() {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Update user profile
  async updateProfile(userData) {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    return handleResponse(response);
  },

  // Change password
  async changePassword(passwords) {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(passwords)
    });
    return handleResponse(response);
  },

  // Forgot password
  async forgotPassword(email) {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return handleResponse(response);
  },

  // Reset password
  async resetPassword(token, password) {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password })
    });
    return handleResponse(response);
  }
};

// ============ TICKETS API ============
const TicketsAPI = {
  // Get all tickets with filters
  async getTickets(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/tickets${queryString ? `?${queryString}` : ''}`;
    const response = await fetch(url, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Get single ticket
  async getTicket(id) {
    const response = await fetch(`${API_BASE_URL}/tickets/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Create new ticket
  async createTicket(ticketData) {
    const response = await fetch(`${API_BASE_URL}/tickets`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(ticketData)
    });
    return handleResponse(response);
  },

  // Update ticket
  async updateTicket(id, ticketData) {
    const response = await fetch(`${API_BASE_URL}/tickets/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(ticketData)
    });
    return handleResponse(response);
  },

  // Delete ticket
  async deleteTicket(id) {
    const response = await fetch(`${API_BASE_URL}/tickets/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Update ticket status
  async updateStatus(id, status) {
    const response = await fetch(`${API_BASE_URL}/tickets/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    return handleResponse(response);
  },

  // Assign ticket
  async assignTicket(id, assignedTo) {
    const response = await fetch(`${API_BASE_URL}/tickets/${id}/assign`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ assignedTo })
    });
    return handleResponse(response);
  },

  // Add comment
  async addComment(ticketId, content) {
    const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/comments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ content })
    });
    return handleResponse(response);
  },

  // Get comments
  async getComments(ticketId) {
    const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/comments`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// ============ USERS API ============
const UsersAPI = {
  // Get all users
  async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/users${queryString ? `?${queryString}` : ''}`;
    const response = await fetch(url, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Get single user
  async getUser(id) {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Create user (admin only)
  async createUser(userData) {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    return handleResponse(response);
  },

  // Update user
  async updateUser(id, userData) {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    return handleResponse(response);
  },

  // Delete user
  async deleteUser(id) {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// ============ CATEGORIES API ============
const CategoriesAPI = {
  // Get all categories
  async getCategories() {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Get single category
  async getCategory(id) {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Create category (admin only)
  async createCategory(categoryData) {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(categoryData)
    });
    return handleResponse(response);
  },

  // Update category
  async updateCategory(id, categoryData) {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(categoryData)
    });
    return handleResponse(response);
  },

  // Delete category
  async deleteCategory(id) {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// ============ REPORTS API ============
const ReportsAPI = {
  // Get dashboard stats
  async getDashboard() {
    const response = await fetch(`${API_BASE_URL}/reports/dashboard`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Get ticket statistics
  async getStats(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/reports/stats${queryString ? `?${queryString}` : ''}`;
    const response = await fetch(url, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Export tickets
  async exportTickets(format = 'csv', params = {}) {
    const queryParams = new URLSearchParams({ format, ...params }).toString();
    const response = await fetch(`${API_BASE_URL}/reports/export?${queryParams}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Export failed');
    }
    
    return response.blob();
  }
};

// ============ NOTIFICATIONS API ============
const NotificationsAPI = {
  // Get notifications
  async getNotifications() {
    const response = await fetch(`${API_BASE_URL}/notifications`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Mark as read
  async markAsRead(id) {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Mark all as read
  async markAllAsRead() {
    const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Delete notification
  async deleteNotification(id) {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// Export all APIs
const API = {
  Auth: AuthAPI,
  Tickets: TicketsAPI,
  Users: UsersAPI,
  Categories: CategoriesAPI,
  Reports: ReportsAPI,
  Notifications: NotificationsAPI
};
