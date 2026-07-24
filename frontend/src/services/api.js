const BASE_URL = '/api';

async function request(url, options = {}) {
  options.credentials = 'include';
  
  if (options.body && typeof options.body === 'object') {
    options.body = JSON.stringify(options.body);
    options.headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
  }

  const response = await fetch(`${BASE_URL}${url}`, options);
  
  if (response.status === 401) {
    // Session expired or unauthorized
    if (url !== '/auth/me' && url !== '/auth/login') {
      window.dispatchEvent(new Event('unauthorized-api-call'));
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Request failed');
  }

  // Handle empty responses or JSON
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

export const authApi = {
  login: (username, password) => 
    request('/auth/login', {
      method: 'POST',
      body: { username, password }
    }),
  registerAdmin: (username, password, fullName) =>
    request('/auth/register-admin', {
      method: 'POST',
      body: { username, password, fullName }
    }),
  me: () => request('/auth/me', { method: 'GET' }),
  logout: () => request('/auth/logout', { method: 'POST' }),
};

export const adminApi = {
  getDashboard: () => request('/admin/dashboard', { method: 'GET' }),
  issueBook: (studentUsername, bookTitle) =>
    request('/admin/issue-book', {
      method: 'POST',
      body: { studentUsername, bookTitle }
    }),
  returnBook: (transId) => request(`/admin/return-book/${transId}`, { method: 'POST' }),
  addStudent: (studentData) =>
    request('/admin/add-student', {
      method: 'POST',
      body: studentData
    }),
  addBook: (bookData) =>
    request('/admin/add-book', {
      method: 'POST',
      body: bookData
    }),
  deleteBook: (id) => request(`/admin/delete-book/${id}`, { method: 'DELETE' }),
};

export const studentApi = {
  getDashboard: () => request('/student/dashboard', { method: 'GET' }),
  returnBook: (transId) => request(`/student/return-book/${transId}`, { method: 'POST' }),
};
