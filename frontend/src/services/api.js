const API_BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/+$/, '') : '';
const BASE_URL = `${API_BASE}/api`;

async function request(url, options = {}) {
  options.credentials = 'include';
  
  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
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
  changePassword: (oldPassword, newPassword) =>
    request('/auth/change-password', {
      method: 'PUT',
      body: { oldPassword, newPassword },
    }),
  forgotPassword: (email) =>
    request('/auth/forgot-password', {
      method: 'POST',
      body: { email },
    }),
  resetPassword: (token, newPassword) =>
    request('/auth/reset-password', {
      method: 'POST',
      body: { token, newPassword },
    }),
};

export const bookApi = {
  getBooks: (params = {}) => {
    const searchParams = new URLSearchParams(params).toString();
    return request(`/books?${searchParams}`, { method: 'GET' });
  },
  getCategories: () => request('/books/categories', { method: 'GET' }),
  getBookById: (id) => request(`/books/${id}`, { method: 'GET' }),
};

export const adminApi = {
  getDashboard: () => request('/admin/dashboard', { method: 'GET' }),
  issueBook: (studentUsername, bookTitle, bookId = null) =>
    request('/admin/issue-book', {
      method: 'POST',
      body: { studentUsername, bookTitle, bookId }
    }),
  returnBook: (transId) => request(`/admin/return-book/${transId}`, { method: 'POST' }),
  addStudent: (studentData) =>
    request('/admin/add-student', {
      method: 'POST',
      body: studentData
    }),
  editStudent: (id, studentData) =>
    request(`/admin/students/${id}`, {
      method: 'PUT',
      body: studentData,
    }),
  deleteStudent: (id) => request(`/admin/students/${id}`, { method: 'DELETE' }),
  getStudents: (search = '') =>
    request(`/admin/students?search=${encodeURIComponent(search)}`, { method: 'GET' }),
  addBook: (bookData) =>
    request('/admin/add-book', {
      method: 'POST',
      body: bookData
    }),
  editBook: (id, bookData) =>
    request(`/admin/books/${id}`, {
      method: 'PUT',
      body: bookData,
    }),
  deleteBook: (id) => request(`/admin/delete-book/${id}`, { method: 'DELETE' }),
  payFine: (transId) => request(`/admin/transactions/${transId}/pay-fine`, { method: 'POST' }),
  getOverdueReport: () => request('/admin/overdue', { method: 'GET' }),
  getStatsReport: () => request('/admin/stats', { method: 'GET' }),
  getTransactions: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/transactions?${query}`, { method: 'GET' });
  },
  resetStudentPassword: (id, newPassword) =>
    request(`/admin/students/${id}/reset-password`, {
      method: 'POST',
      body: { newPassword },
    }),
  importBooks: (formData) =>
    request('/admin/import/books', {
      method: 'POST',
      body: formData,
    }),
  importStudents: (formData) =>
    request('/admin/import/students', {
      method: 'POST',
      body: formData,
    }),
  downloadBooksTemplateUrl: () => `${BASE_URL}/admin/templates/books.xlsx`,
  downloadStudentsTemplateUrl: () => `${BASE_URL}/admin/templates/students.xlsx`,
  exportTransactionsCsvUrl: () => `${BASE_URL}/admin/export/transactions.csv`,
};

export const studentApi = {
  getDashboard: () => request('/student/dashboard', { method: 'GET' }),
  returnBook: (transId) => request(`/student/return-book/${transId}`, { method: 'POST' }),
  renewBook: (transId) => request(`/student/renew/${transId}`, { method: 'POST' }),
  reserveBook: (bookId) => request(`/student/reserve/${bookId}`, { method: 'POST' }),
  cancelReservation: (reservationId) => request(`/student/reserve/${reservationId}`, { method: 'DELETE' }),
  getReservations: () => request('/student/reservations', { method: 'GET' }),
  getFines: () => request('/student/fines', { method: 'GET' }),
  getHistory: () => request('/student/history', { method: 'GET' }),
};
