import { useState, useEffect } from 'react';
import { authApi, adminApi, studentApi } from './api';

export default function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register-admin'
  const [roleMode, setRoleMode] = useState('admin'); // 'admin' | 'student'

  useEffect(() => {
    document.documentElement.className = `theme-${theme}`;
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  // Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  // Feedback
  const [toast, setToast] = useState(null);

  // Admin Dashboard States
  const [adminTab, setAdminTab] = useState('overview'); // 'overview' | 'books' | 'students' | 'issue' | 'transactions'
  const [adminData, setAdminData] = useState({
    statBooks: 0,
    statIssued: 0,
    statStudents: 0,
    statFines: 0.0,
    transactions: [],
    books: [],
    users: [],
    branchList: [],
    yearList: []
  });
  
  // Student Dashboard States
  const [studentTab, setStudentTab] = useState('mybooks'); // 'mybooks' | 'catalog'
  const [studentData, setStudentData] = useState({
    user: {},
    myBooks: [],
    catalog: []
  });

  // Admin Input Forms
  const [newBook, setNewBook] = useState({ title: '', author: '', copies: 1, imageUrl: '' });
  const [newStudent, setNewStudent] = useState({ username: '', password: '', fullName: '', branch: 'CSE', year: '1st Year', email: '' });
  const [issuePayload, setIssuePayload] = useState({ studentUsername: '', bookTitle: '' });
  
  // Catalog search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Show Toast
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAdminData = async () => {
    try {
      const data = await adminApi.getDashboard();
      setAdminData(data);
    } catch (err) {
      showToast('Failed to load dashboard data: ' + err.message, 'error');
    }
  };

  const fetchStudentData = async () => {
    try {
      const data = await studentApi.getDashboard();
      setStudentData(data);
    } catch (err) {
      showToast('Failed to load student dashboard: ' + err.message, 'error');
    }
  };

  const checkSession = async () => {
    try {
      const currentUser = await authApi.me();
      setUser(currentUser);
      if (currentUser.role === 'ROLE_ADMIN') {
        fetchAdminData();
      } else {
        fetchStudentData();
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Check Session on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkSession();

    // Listen for 401s from the API helper
    const handleUnauthorized = () => {
      setUser(null);
      showToast('Session expired. Please login again.', 'error');
    };
    window.addEventListener('unauthorized-api-call', handleUnauthorized);
    return () => window.removeEventListener('unauthorized-api-call', handleUnauthorized);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    setLoading(true);
    try {
      const loggedInUser = await authApi.login(username, password);
      setUser(loggedInUser);
      setUsername('');
      setPassword('');
      showToast(`Welcome back, ${loggedInUser.fullName || loggedInUser.username}!`);
      if (loggedInUser.role === 'ROLE_ADMIN') {
        fetchAdminData();
        setAdminTab('overview');
      } else {
        fetchStudentData();
        setStudentTab('mybooks');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterAdmin = async (e) => {
    e.preventDefault();
    if (!username || !password || !fullName) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    setLoading(true);
    try {
      await authApi.registerAdmin(username, password, fullName);
      showToast('Admin registered successfully! Please login.');
      setAuthMode('login');
      setUsername('');
      setPassword('');
      setFullName('');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      setUser(null);
      showToast('Logged out successfully.');
    } catch (err) {
      showToast('Logout failed: ' + err.message, 'error');
    }
  };

  // ADMIN OPERATIONS
  const handleAddBook = async (e) => {
    e.preventDefault();
    if (!newBook.title || !newBook.author || newBook.copies < 1) {
      showToast('Please enter title, author, and at least 1 copy', 'error');
      return;
    }
    try {
      await adminApi.addBook(newBook);
      showToast('Book added successfully!');
      setNewBook({ title: '', author: '', copies: 1, imageUrl: '' });
      fetchAdminData();
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  };

  const handleDeleteBook = async (id) => {
    if (!window.confirm('Are you sure you want to delete this book? This will also clear all transaction history for this book.')) return;
    try {
      await adminApi.deleteBook(id);
      showToast('Book deleted successfully');
      fetchAdminData();
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!newStudent.username || !newStudent.password || !newStudent.fullName) {
      showToast('Please fill in username, password, and name', 'error');
      return;
    }
    try {
      await adminApi.addStudent(newStudent);
      showToast('Student added successfully!');
      setNewStudent({ username: '', password: '', fullName: '', branch: 'CSE', year: '1st Year', email: '' });
      fetchAdminData();
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  };

  const handleIssueBook = async (e) => {
    e.preventDefault();
    if (!issuePayload.studentUsername || !issuePayload.bookTitle) {
      showToast('Please fill in student username and book title', 'error');
      return;
    }
    try {
      await adminApi.issueBook(issuePayload.studentUsername, issuePayload.bookTitle);
      showToast('Book issued successfully!');
      setIssuePayload({ studentUsername: '', bookTitle: '' });
      fetchAdminData();
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  };

  const handleAdminReturnBook = async (transId) => {
    try {
      const res = await adminApi.returnBook(transId);
      showToast(`Book returned! Fine calculated: ₹${res.fine || 0.0}`);
      fetchAdminData();
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  };

  // STUDENT OPERATIONS
  const handleStudentReturnBook = async (transId) => {
    try {
      await studentApi.returnBook(transId);
      showToast('Book returned successfully!');
      fetchStudentData();
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  };

  // Format date utility
  const formatDate = (dateString) => {
    if (!dateString) return 'Pending';
    const d = new Date(dateString);
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Helper book cover renderer
  const renderBookCover = (title, author, url) => {
    const hasUrl = url && url.trim().startsWith('http');
    return (
      <div className="book-cover-wrapper-inner" style={{ position: 'relative', width: '100%', height: '100%', display: 'flex' }}>
        {hasUrl && (
          <img 
            src={url} 
            alt={title} 
            className="book-cover-img" 
            onError={(e) => { 
              e.target.style.display = 'none'; 
              const placeholder = e.target.parentNode.querySelector('.book-cover-placeholder');
              if (placeholder) placeholder.style.display = 'flex';
            }} 
          />
        )}
        <div 
          className="book-cover-placeholder" 
          style={{ display: hasUrl ? 'none' : 'flex' }}
        >
          <span className="cover-icon">📖</span>
          <span className="cover-title">{title}</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <p>Initializing Library Portal...</p>
      </div>
    );
  }

  // Toast alert banner
  const renderToast = () => {
    if (!toast) return null;
    return (
      <div className={`toast-banner ${toast.type === 'error' ? 'toast-error' : 'toast-success'} animate-fade-in`}>
        <span>{toast.type === 'error' ? '⚠️' : '✨'}</span>
        <p>{toast.message}</p>
      </div>
    );
  };

  // ==================== 1. AUTH SCREEN ====================
  if (!user) {
    return (
      <div className="auth-container">
        {renderToast()}
        <button 
          className="theme-toggle-floating"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="Toggle Theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        
        <div className="auth-decorations">
          <div className="decor-blob blob-1"></div>
          <div className="decor-blob blob-2"></div>
        </div>

        <div className="auth-card glass-panel animate-fade-in">
          <div className="auth-header">
            <span className="auth-logo-icon">📚</span>
            <h2>Bibliotech Library</h2>
            <p>Smart Management Portal</p>
          </div>

          {authMode === 'login' ? (
            <>
              {/* Role Toggle */}
              <div className="role-toggle">
                <button 
                  className={`role-btn ${roleMode === 'admin' ? 'active' : ''}`}
                  onClick={() => setRoleMode('admin')}
                >
                  🛡️ Administrator
                </button>
                <button 
                  className={`role-btn ${roleMode === 'student' ? 'active' : ''}`}
                  onClick={() => setRoleMode('student')}
                >
                  🎓 Student
                </button>
              </div>

              <form onSubmit={handleLogin} className="auth-form">
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder={roleMode === 'admin' ? 'e.g. admin_user' : 'e.g. student_rahul'}
                    value={username} 
                    onChange={e => setUsername(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="••••••••"
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                  />
                </div>
                <button type="submit" className="btn btn-primary w-full">
                  Sign In as {roleMode === 'admin' ? 'Admin' : 'Student'}
                </button>
              </form>

              {roleMode === 'admin' && (
                <p className="auth-footer">
                  New Admin?{' '}
                  <span onClick={() => setAuthMode('register-admin')}>Register credentials</span>
                </p>
              )}
            </>
          ) : (
            <>
              <div className="register-header">
                <h3>Create Admin Account</h3>
                <p>Set up new library system manager credentials</p>
              </div>

              <form onSubmit={handleRegisterAdmin} className="auth-form">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Aditya Upadhyay" 
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. aditya_admin" 
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary w-full">
                  Create Admin
                </button>
              </form>

              <p className="auth-footer">
                Already have credentials?{' '}
                <span onClick={() => setAuthMode('login')}>Return to Login</span>
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // ==================== 2. ADMIN DASHBOARD ====================
  if (user.role === 'ROLE_ADMIN') {
    return (
      <div className="dashboard-layout">
        {renderToast()}
        
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-brand">
            <span className="brand-logo">📚</span>
            <div>
              <h3>Bibliotech</h3>
              <p>Admin Control</p>
            </div>
          </div>
          
          <nav className="sidebar-nav">
            <button 
              className={`nav-link ${adminTab === 'overview' ? 'active' : ''}`}
              onClick={() => setAdminTab('overview')}
            >
              📊 Overview
            </button>
            <button 
              className={`nav-link ${adminTab === 'books' ? 'active' : ''}`}
              onClick={() => setAdminTab('books')}
            >
              📖 Book Repository
            </button>
            <button 
              className={`nav-link ${adminTab === 'students' ? 'active' : ''}`}
              onClick={() => setAdminTab('students')}
            >
              👥 Students List
            </button>
            <button 
              className={`nav-link ${adminTab === 'issue' ? 'active' : ''}`}
              onClick={() => setAdminTab('issue')}
            >
              ⚡ Issue Book
            </button>
            <button 
              className={`nav-link ${adminTab === 'transactions' ? 'active' : ''}`}
              onClick={() => setAdminTab('transactions')}
            >
              ⏳ Log/Transactions
            </button>
          </nav>

          <div className="sidebar-footer">
            <div className="user-profile-badge">
              <div className="avatar">🛡️</div>
              <div className="profile-details">
                <span className="name">{user.fullName || user.username}</span>
                <span className="role">Administrator</span>
              </div>
            </div>
            <button className="btn btn-danger btn-sm w-full mt-4" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="workspace">
          <header className="workspace-header">
            <h2>{adminTab.charAt(0).toUpperCase() + adminTab.slice(1)} Workspace</h2>
            <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button 
                className="theme-toggle-btn"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                title="Toggle Theme"
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
              <div className="system-status">
                <span className="status-dot green"></span>
                MySQL Connected
              </div>
            </div>
          </header>

          <div className="workspace-content animate-fade-in">
            
            {/* OVERVIEW TAB */}
            {adminTab === 'overview' && (
              <div className="tab-pane">
                {/* Stats Grid */}
                <div className="stats-grid">
                  <div className="stat-card glass-panel gradient-border-primary">
                    <span className="stat-icon">📚</span>
                    <div className="stat-value">{adminData.statBooks}</div>
                    <div className="stat-label">Total Books Cataloged</div>
                  </div>
                  <div className="stat-card glass-panel gradient-border-secondary">
                    <span className="stat-icon">📖</span>
                    <div className="stat-value">{adminData.statIssued}</div>
                    <div className="stat-label">Books Issued Currently</div>
                  </div>
                  <div className="stat-card glass-panel gradient-border-emerald">
                    <span className="stat-icon">🎓</span>
                    <div className="stat-value">{adminData.statStudents}</div>
                    <div className="stat-label font-bold">Students Registered</div>
                  </div>
                  <div className="stat-card glass-panel gradient-border-amber">
                    <span className="stat-icon">₹</span>
                    <div className="stat-value">₹{adminData.statFines.toFixed(2)}</div>
                    <div className="stat-label">Total Late Return Fines</div>
                  </div>
                </div>

                {/* Recent Transactions List */}
                <div className="dashboard-section mt-8">
                  <h3>Recent Library Activities</h3>
                  <div className="table-container">
                    <table className="modern-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Book Title</th>
                          <th>Issue Date</th>
                          <th>Due Date</th>
                          <th>Return Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminData.transactions.slice(0, 5).map(t => (
                          <tr key={t.id}>
                            <td>{t.student?.fullName || t.student?.username}</td>
                            <td>{t.book?.title}</td>
                            <td>{formatDate(t.issueDate)}</td>
                            <td>{formatDate(t.dueDate)}</td>
                            <td>{t.returnDate ? formatDate(t.returnDate) : '-'}</td>
                            <td>
                              <span className={`badge ${t.returnDate ? 'badge-success' : 'badge-danger'}`}>
                                {t.returnDate ? 'Returned' : 'Pending'}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {adminData.transactions.length === 0 && (
                          <tr>
                            <td colSpan="6" className="text-center text-muted">No transactions available yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* BOOKS TAB */}
            {adminTab === 'books' && (
              <div className="tab-pane-columns">
                <div className="main-col">
                  <div className="glass-panel">
                    <h3>Repository Catalog</h3>
                    <div className="table-container">
                      <table className="modern-table">
                        <thead>
                          <tr>
                            <th>Book Cover</th>
                            <th>Book Details</th>
                            <th>Author</th>
                            <th>Available Copies</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminData.books.map(b => (
                            <tr key={b.id}>
                              <td>
                                <div className="table-cover-wrapper">
                                  {renderBookCover(b.title, b.author, b.imageUrl)}
                                </div>
                              </td>
                              <td>
                                <div className="font-bold">{b.title}</div>
                                <span className="text-xs text-muted">ID: #{b.id}</span>
                              </td>
                              <td>{b.author}</td>
                              <td>
                                <span className={`badge ${b.copies > 0 ? 'badge-success' : 'badge-danger'}`}>
                                  {b.copies} Copies
                                </span>
                              </td>
                              <td>
                                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteBook(b.id)}>
                                  Delete Book
                                </button>
                              </td>
                            </tr>
                          ))}
                          {adminData.books.length === 0 && (
                            <tr>
                              <td colSpan="5" className="text-center text-muted">No books in catalog. Add one!</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                
                <aside className="side-col">
                  <div className="glass-panel sticky-form">
                    <h3>Add New Book</h3>
                    <form onSubmit={handleAddBook} className="mt-4">
                      <div className="form-group">
                        <label className="form-label">Book Title</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="e.g. Advanced Java Concepts"
                          value={newBook.title}
                          onChange={e => setNewBook({...newBook, title: e.target.value})}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Author Name</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="e.g. Herbert Schildt"
                          value={newBook.author}
                          onChange={e => setNewBook({...newBook, author: e.target.value})}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Total Copies</label>
                        <input 
                          type="number" 
                          className="form-input" 
                          min="1"
                          value={newBook.copies}
                          onChange={e => setNewBook({...newBook, copies: parseInt(e.target.value) || 1})}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Cover Image URL (Optional)</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="e.g. https://images.com/cover.jpg"
                          value={newBook.imageUrl || ''}
                          onChange={e => setNewBook({...newBook, imageUrl: e.target.value})}
                        />
                      </div>
                      <button type="submit" className="btn btn-primary w-full mt-2">
                        Add to Catalog
                      </button>
                    </form>
                  </div>
                </aside>
              </div>
            )}

            {/* STUDENTS TAB */}
            {adminTab === 'students' && (
              <div className="tab-pane-columns">
                <div className="main-col">
                  <div className="glass-panel">
                    <h3>Registered Students</h3>
                    <div className="table-container">
                      <table className="modern-table">
                        <thead>
                          <tr>
                            <th>Student Name</th>
                            <th>Username</th>
                            <th>Branch</th>
                            <th>Academic Year</th>
                            <th>Email Address</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminData.users.filter(u => u.role === 'ROLE_STUDENT').map(s => (
                            <tr key={s.id}>
                              <td>
                                <div className="font-bold">{s.fullName}</div>
                              </td>
                              <td><code>{s.username}</code></td>
                              <td>{s.branch || 'N/A'}</td>
                              <td>{s.year || 'N/A'}</td>
                              <td>{s.email || <span className="text-muted italic">None</span>}</td>
                            </tr>
                          ))}
                          {adminData.users.filter(u => u.role === 'ROLE_STUDENT').length === 0 && (
                            <tr>
                              <td colSpan="5" className="text-center text-muted">No students registered yet.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <aside className="side-col">
                  <div className="glass-panel sticky-form">
                    <h3>Register Student</h3>
                    <form onSubmit={handleAddStudent} className="mt-4">
                      <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="e.g. Rahul Sharma"
                          value={newStudent.fullName}
                          onChange={e => setNewStudent({...newStudent, fullName: e.target.value})}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Username</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="e.g. rahul12"
                          value={newStudent.username}
                          onChange={e => setNewStudent({...newStudent, username: e.target.value})}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Login Password</label>
                        <input 
                          type="password" 
                          className="form-input" 
                          placeholder="••••••••"
                          value={newStudent.password}
                          onChange={e => setNewStudent({...newStudent, password: e.target.value})}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Branch/Course</label>
                        <select 
                          className="form-input"
                          value={newStudent.branch}
                          onChange={e => setNewStudent({...newStudent, branch: e.target.value})}
                        >
                          <option value="CSE">Computer Science (CSE)</option>
                          <option value="ECE">Electronics (ECE)</option>
                          <option value="ME">Mechanical (ME)</option>
                          <option value="Civil">Civil Engineering</option>
                          <option value="IT">Information Tech (IT)</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Academic Year</label>
                        <select 
                          className="form-input"
                          value={newStudent.year}
                          onChange={e => setNewStudent({...newStudent, year: e.target.value})}
                        >
                          <option value="1st Year">1st Year (Freshman)</option>
                          <option value="2nd Year">2nd Year (Sophomore)</option>
                          <option value="3rd Year">3rd Year (Junior)</option>
                          <option value="4th Year">4th Year (Senior)</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Email (For Notifications)</label>
                        <input 
                          type="email" 
                          className="form-input" 
                          placeholder="e.g. rahul@example.com"
                          value={newStudent.email}
                          onChange={e => setNewStudent({...newStudent, email: e.target.value})}
                        />
                      </div>
                      <button type="submit" className="btn btn-primary w-full mt-2">
                        Add Student User
                      </button>
                    </form>
                  </div>
                </aside>
              </div>
            )}

            {/* ISSUE BOOK TAB */}
            {adminTab === 'issue' && (
              <div className="tab-pane-center">
                <div className="glass-panel max-w-2xl mx-auto">
                  <h3>Issue Book to Student</h3>
                  <p className="text-muted text-sm mt-1">This registers a book loan transaction and generates automated email notifications.</p>
                  
                  <form onSubmit={handleIssueBook} className="mt-6">
                    <div className="form-group">
                      <label className="form-label">Select Registered Student (By Username)</label>
                      <select 
                        className="form-input"
                        value={issuePayload.studentUsername}
                        onChange={e => setIssuePayload({...issuePayload, studentUsername: e.target.value})}
                      >
                        <option value="">-- Select Student User --</option>
                        {adminData.users.filter(u => u.role === 'ROLE_STUDENT').map(s => (
                          <option key={s.id} value={s.username}>{s.fullName} ({s.username})</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group mt-4">
                      <label className="form-label">Select Book (By Title)</label>
                      <select 
                        className="form-input"
                        value={issuePayload.bookTitle}
                        onChange={e => setIssuePayload({...issuePayload, bookTitle: e.target.value})}
                      >
                        <option value="">-- Select Available Book --</option>
                        {adminData.books.map(b => (
                          <option key={b.id} value={b.title} disabled={b.copies <= 0}>
                            {b.title} {b.copies <= 0 ? '(Out of stock)' : `(${b.copies} copies remaining)`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button type="submit" className="btn btn-primary w-full mt-6">
                      Proceed and Issue Book
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* TRANSACTIONS TAB */}
            {adminTab === 'transactions' && (
              <div className="tab-pane">
                <div className="glass-panel">
                  <h3>Library Master Log Transactions</h3>
                  <div className="table-container">
                    <table className="modern-table">
                      <thead>
                        <tr>
                          <th>Transaction ID</th>
                          <th>Student Details</th>
                          <th>Book Details</th>
                          <th>Issue Date</th>
                          <th>Due Date</th>
                          <th>Return Date</th>
                          <th>Fines Charged</th>
                          <th>Status & Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminData.transactions.map(t => (
                          <tr key={t.id}>
                            <td><code>TX-{t.id}</code></td>
                            <td>
                              <div className="font-bold">{t.student?.fullName}</div>
                              <span className="text-xs text-muted">@{t.student?.username}</span>
                            </td>
                            <td>{t.book?.title}</td>
                            <td>{formatDate(t.issueDate)}</td>
                            <td>{formatDate(t.dueDate)}</td>
                            <td>{t.returnDate ? formatDate(t.returnDate) : <span className="text-warning font-semibold">Active</span>}</td>
                            <td>
                              {t.fine !== null ? (
                                <span className={t.fine > 0 ? 'text-danger font-bold' : 'text-success'}>
                                  ₹{t.fine.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-muted italic">Pending check</span>
                              )}
                            </td>
                            <td>
                              {t.returnDate ? (
                                <span className="badge badge-success">Returned</span>
                              ) : (
                                <button className="btn btn-primary btn-sm" onClick={() => handleAdminReturnBook(t.id)}>
                                  Mark Returned
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                        {adminData.transactions.length === 0 && (
                          <tr>
                            <td colSpan="8" className="text-center text-muted">No transaction logs recorded.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    );
  }

  // ==================== 3. STUDENT DASHBOARD ====================
  if (user.role === 'ROLE_STUDENT') {
    return (
      <div className="student-dashboard-layout">
        {renderToast()}
        
        {/* Header navigation bar */}
        <header className="student-header glass-panel">
          <div className="header-brand">
            <span className="logo">📚</span>
            <div>
              <h2>Bibliotech Student Portal</h2>
              <p>Welcome, {studentData.user?.fullName || user.username}</p>
            </div>
          </div>
          
          <nav className="student-nav">
            <button 
              className={`student-nav-btn ${studentTab === 'mybooks' ? 'active' : ''}`}
              onClick={() => { setStudentTab('mybooks'); fetchStudentData(); }}
            >
              📖 My Issued Books ({studentData.myBooks?.filter(t => !t.returnDate).length || 0})
            </button>
            <button 
              className={`student-nav-btn ${studentTab === 'catalog' ? 'active' : ''}`}
              onClick={() => { setStudentTab('catalog'); fetchStudentData(); }}
            >
              🔍 Search Book Catalog
            </button>
          </nav>

          <div className="student-profile-summary">
            <button 
              className="theme-toggle-btn"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              style={{ marginRight: '8px' }}
              title="Toggle Theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <div className="student-meta">
              <span className="badge badge-warning">{studentData.user?.branch}</span>
              <span className="badge badge-success">{studentData.user?.year}</span>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
              Sign Out
            </button>
          </div>
        </header>

        {/* Content container */}
        <main className="student-content animate-fade-in mt-6">
          
          {/* MY ISSUED BOOKS */}
          {studentTab === 'mybooks' && (
            <div className="glass-panel">
              <h3>My Library Loan Ledger</h3>
              <p className="text-muted text-sm mt-1">Below are all active and completed book issues linked to your account.</p>
              
              <div className="table-container mt-4">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Book Cover</th>
                      <th>Book Details</th>
                      <th>Issue Date</th>
                      <th>Due Date</th>
                      <th>Return Date</th>
                      <th>Fines</th>
                      <th>Status & Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentData.myBooks.map(t => (
                      <tr key={t.id}>
                        <td>
                          <div className="table-cover-wrapper">
                            {renderBookCover(t.book?.title, t.book?.author, t.book?.imageUrl)}
                          </div>
                        </td>
                        <td>
                          <div className="font-bold">{t.book?.title}</div>
                          <div className="text-xs text-muted">Author: {t.book?.author}</div>
                        </td>
                        <td>{formatDate(t.issueDate)}</td>
                        <td>{formatDate(t.dueDate)}</td>
                        <td>{t.returnDate ? formatDate(t.returnDate) : <span className="text-warning font-semibold">Active Loan</span>}</td>
                        <td>
                          {t.fine !== null ? (
                            <span className={t.fine > 0 ? 'text-danger font-bold' : 'text-success'}>
                              ₹{t.fine.toFixed(2)}
                            </span>
                          ) : (
                            <span>-</span>
                          )}
                        </td>
                        <td>
                          {t.returnDate ? (
                            <span className="badge badge-success">Returned Successfully</span>
                          ) : (
                            <button className="btn btn-primary btn-sm" onClick={() => handleStudentReturnBook(t.id)}>
                              Return Book
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {studentData.myBooks.length === 0 && (
                      <tr>
                        <td colSpan="7" className="text-center text-muted p-8">
                          No books currently issued to your account. Go search the catalog!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CATALOG SEARCH */}
          {studentTab === 'catalog' && (
            <div className="glass-panel">
              <div className="catalog-header">
                <div>
                  <h3>Search Library Catalog</h3>
                  <p className="text-muted text-sm mt-1">Browse and search for available titles in the inventory.</p>
                </div>
                <div className="search-bar">
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Search by title, author..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Grid Layout of Books */}
              <div className="catalog-grid mt-6">
                {studentData.catalog
                  .filter(b => 
                    b.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    b.author?.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map(b => (
                    <div key={b.id} className="book-grid-card glass-card">
                      <div className="card-cover">
                        {renderBookCover(b.title, b.author, b.imageUrl)}
                      </div>
                      <div className="card-info mt-4">
                        <h4>{b.title}</h4>
                        <p className="author">by {b.author}</p>
                        <div className="card-footer-info mt-4">
                          <span className={`badge ${b.copies > 0 ? 'badge-success' : 'badge-danger'}`}>
                            {b.copies > 0 ? `${b.copies} Copies Available` : 'Out of Stock'}
                          </span>
                          <span className="book-id">#ID {b.id}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                {studentData.catalog.length === 0 && (
                  <p className="text-muted col-span-full text-center py-8">No matching books found in repository.</p>
                )}
              </div>
            </div>
          )}

        </main>
      </div>
    );
  }

  return null;
}
