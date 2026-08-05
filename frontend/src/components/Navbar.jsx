/**
 * Navigation bar with auth-aware links
 */
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">📅</span>
          Smart Appointments
        </Link>

        <nav className="navbar-links">
          {isAuthenticated ? (
            <>
              <Link to="/">Slots</Link>
              <Link to="/my-appointments">My Appointments</Link>
              {isAdmin && <Link to="/admin">Admin Dashboard</Link>}
              <span className="navbar-user">Hi, {user?.name}</span>
              <button type="button" className="btn btn-ghost" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
