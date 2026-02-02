/**
 * IT Ticket Request - Utilities
 * Common utility functions
 */

// ============ DATE/TIME UTILITIES ============
const DateUtils = {
  // Format date to locale string
  formatDate(date, options = {}) {
    const d = new Date(date);
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    };
    return d.toLocaleDateString('th-TH', defaultOptions);
  },

  // Format datetime
  formatDateTime(date) {
    const d = new Date(date);
    return d.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Format relative time (e.g., "2 hours ago")
  formatRelativeTime(date) {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now - then;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'เมื่อสักครู่';
    if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
    if (diffDays === 1) return 'เมื่อวาน';
    if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
    
    return this.formatDate(date);
  },

  // Get days difference
  getDaysDifference(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffMs = Math.abs(d2 - d1);
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }
};

// ============ STRING UTILITIES ============
const StringUtils = {
  // Truncate text
  truncate(text, maxLength = 100, suffix = '...') {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + suffix;
  },

  // Capitalize first letter
  capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  // Convert to title case
  titleCase(str) {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  },

  // Generate slug
  slugify(str) {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  // Format number with commas
  formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
};

// ============ STATUS/PRIORITY UTILITIES ============
const StatusUtils = {
  // Get status badge class
  getStatusBadgeClass(status) {
    const classes = {
      'open': 'badge-open',
      'in_progress': 'badge-in-progress',
      'resolved': 'badge-resolved',
      'closed': 'badge-closed',
      'pending': 'badge-pending',
      'reopened': 'badge-open'
    };
    return classes[status] || 'badge-open';
  },

  // Get status display name
  getStatusDisplayName(status) {
    const names = {
      'open': 'เปิด',
      'in_progress': 'กำลังดำเนินการ',
      'resolved': 'แก้ไขแล้ว',
      'closed': 'ปิด',
      'pending': 'รอดำเนินการ',
      'reopened': 'เปิดใหม่'
    };
    return names[status] || status;
  },

  // Get priority badge class
  getPriorityBadgeClass(priority) {
    const classes = {
      'low': 'badge-priority-low',
      'medium': 'badge-priority-medium',
      'high': 'badge-priority-high',
      'urgent': 'badge-priority-urgent'
    };
    return classes[priority] || 'badge-priority-low';
  },

  // Get priority display name
  getPriorityDisplayName(priority) {
    const names = {
      'low': 'ต่ำ',
      'medium': 'ปานกลาง',
      'high': 'สูง',
      'urgent': 'เร่งด่วน'
    };
    return names[priority] || priority;
  },

  // Get role display name
  getRoleDisplayName(role) {
    const names = {
      'admin': 'ผู้ดูแลระบบ',
      'agent': 'เจ้าหน้าที่',
      'user': 'ผู้ใช้งาน'
    };
    return names[role] || role;
  }
};

// ============ VALIDATION UTILITIES ============
const ValidationUtils = {
  // Validate email
  isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  // Validate password (min 8 chars, at least 1 letter and 1 number)
  isValidPassword(password) {
    return password.length >= 8 && /[a-zA-Z]/.test(password) && /\d/.test(password);
  },

  // Validate phone number (Thai format)
  isValidPhone(phone) {
    const re = /^0[0-9]{8,9}$/;
    return re.test(phone);
  },

  // Validate required field
  isRequired(value) {
    return value !== null && value !== undefined && value.toString().trim() !== '';
  },

  // Validate min length
  minLength(value, min) {
    return value && value.length >= min;
  },

  // Validate max length
  maxLength(value, max) {
    return value && value.length <= max;
  }
};

// ============ STORAGE UTILITIES ============
const StorageUtils = {
  // Set item with expiry
  setWithExpiry(key, value, ttlMinutes) {
    const now = new Date();
    const item = {
      value: value,
      expiry: now.getTime() + (ttlMinutes * 60 * 1000)
    };
    localStorage.setItem(key, JSON.stringify(item));
  },

  // Get item with expiry check
  getWithExpiry(key) {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;

    const item = JSON.parse(itemStr);
    const now = new Date();

    if (now.getTime() > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }

    return item.value;
  },

  // Set JSON item
  setJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  // Get JSON item
  getJSON(key) {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }
};

// ============ DOM UTILITIES ============
const DOMUtils = {
  // Show loading state on button
  setButtonLoading(button, loading = true) {
    if (loading) {
      button.disabled = true;
      button.dataset.originalText = button.innerHTML;
      button.innerHTML = '<span class="spinner" style="width: 16px; height: 16px; display: inline-block; vertical-align: middle; margin-right: 8px;"></span> กำลังโหลด...';
    } else {
      button.disabled = false;
      button.innerHTML = button.dataset.originalText || button.innerText;
    }
  },

  // Show alert/message
  showAlert(container, message, type = 'info') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = message;
    container.innerHTML = '';
    container.appendChild(alert);
  },

  // Clear form errors
  clearFormErrors(form) {
    form.querySelectorAll('.form-error').forEach(el => el.remove());
    form.querySelectorAll('.is-error').forEach(el => el.classList.remove('is-error'));
  },

  // Show field error
  showFieldError(input, message) {
    input.classList.add('is-error');
    const errorEl = document.createElement('div');
    errorEl.className = 'form-error';
    errorEl.textContent = message;
    input.parentNode.appendChild(errorEl);
  },

  // Create element with attributes
  createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key.startsWith('on')) {
        element.addEventListener(key.slice(2).toLowerCase(), value);
      } else {
        element.setAttribute(key, value);
      }
    });
    children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else {
        element.appendChild(child);
      }
    });
    return element;
  },

  // Debounce function
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Throttle function
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
};

// ============ EXPORT ============
const Utils = {
  Date: DateUtils,
  String: StringUtils,
  Status: StatusUtils,
  Validation: ValidationUtils,
  Storage: StorageUtils,
  DOM: DOMUtils
};
