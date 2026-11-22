import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../application/hooks/useAuth';
import { Toast } from '../components/Toast';

export function AuthPage() {
  const { user, login, theme, toggleTheme, showToast } = useAuth();
  const navigate = useNavigate();

  const [roleMode, setRoleMode] = useState('admin'); // 'admin' | 'student'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // If user is already logged in, redirect them immediately
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
    if (!username.trim() || !password) {
      showToast('Please enter both username and password', 'error');
      return;
    }
    try {
      const loggedInUser = await login(username.trim(), password);
      if (loggedInUser.role === 'ROLE_ADMIN') {
        navigate('/admin');
      } else {
        navigate('/student');
      }
    } catch {
      // Handled by context toast
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
              required
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
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-full mt-2">
            Sign In as {roleMode === 'admin' ? 'Admin' : 'Student'}
          </button>
        </form>

        <div className="text-center mt-5 text-xs text-muted">
          <span>🔒 Protected Library System &bull; Authorized Accounts Only</span>
        </div>
      </div>
    </div>
  );
}
