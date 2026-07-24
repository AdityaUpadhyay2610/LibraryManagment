import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../application/hooks/useAuth';
import { Toast } from '../components/Toast';

export function AuthPage() {
  const { user, login, registerAdmin, theme, toggleTheme, showToast } = useAuth();
  const navigate = useNavigate();

  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register-admin'
  const [roleMode, setRoleMode] = useState('admin'); // 'admin' | 'student'

  // Input states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // If user is already logged in, redirect them
  useEffect(() => {
    if (user) {
      if (user.role === 'ROLE_ADMIN') {
        navigate('/admin', { replace: true });
      } else if (user.role === 'ROLE_STUDENT') {
        navigate('/student', { replace: true });
      }
    }
  }, [user, navigate]);

  const handleSubmitLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    try {
      const loggedInUser = await login(username, password);
      if (loggedInUser.role === 'ROLE_ADMIN') {
        navigate('/admin');
      } else {
        navigate('/student');
      }
    } catch {
      // Ignored: context shows toast
    }
  };

  const handleSubmitRegister = async (e) => {
    e.preventDefault();
    if (!username || !password || !fullName) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    try {
      await registerAdmin(username, password, fullName);
      setAuthMode('login');
      setUsername('');
      setPassword('');
      setFullName('');
    } catch {
      // Ignored
    }
  };

  return (
    <div className="auth-container">
      <Toast />
      <button 
        className="theme-toggle-floating"
        onClick={toggleTheme}
        title="Toggle Theme"
        type="button"
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
                type="button"
                className={`role-btn ${roleMode === 'admin' ? 'active' : ''}`}
                onClick={() => setRoleMode('admin')}
              >
                🛡️ Administrator
              </button>
              <button 
                type="button"
                className={`role-btn ${roleMode === 'student' ? 'active' : ''}`}
                onClick={() => setRoleMode('student')}
              >
                🎓 Student
              </button>
            </div>

            <form onSubmit={handleSubmitLogin} className="auth-form">
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

            <form onSubmit={handleSubmitRegister} className="auth-form">
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
