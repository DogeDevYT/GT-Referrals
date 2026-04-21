import { useState, useEffect } from 'react'; 
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';
  const profilePhoto = user?.profilePhoto || user?.linkedin?.photo;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="navbar-logo-gt">GT</span>
          <span className="navbar-logo-text"> Referrals</span>
        </Link>

        {user && (
          <div className="navbar-links">
            {user.role === 'jobseeker' && (
              <>
                <Link to="/find-alumni" className={`navbar-link ${isActive('/find-alumni') ? 'active' : ''}`}>
                  Find Alumni
                </Link>
                <Link to="/my-requests" className={`navbar-link ${isActive('/my-requests') ? 'active' : ''}`}>
                  My Requests
                </Link>
              </>
            )}
            {user.role === 'employee' && (
              <>
                <Link to="/inbox" className={`navbar-link ${isActive('/inbox') ? 'active' : ''}`}>
                  Inbox
                </Link>
              </>
            )}
          </div>
        )}

        <div className="navbar-right">
          {user ? (
            <div className="navbar-user-menu flex items-center gap-3">
              <Link
                to="/profile"
                className="avatar navbar-avatar navbar-avatar-link"
                title="Edit profile"
              >
                {profilePhoto ? (
                  <img src={profilePhoto} alt={user.name} />
                ) : (
                  <div className="initials-fallback">
                    {initials}
                  </div>
                )}
              </Link>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                Sign out
              </button>
            </div>
          ) : (
            <div className="navbar-auth-links">
              <Link to="/login" className="btn btn-ghost btn-sm">Sign in</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get started</Link>
            </div>
          )}

          {/* Wrap it in this div so the CSS can control its position */}
          <div className="theme-toggle-container">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}