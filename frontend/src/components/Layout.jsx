import { NavLink, Outlet } from 'react-router-dom';
import './Layout.css';

export default function Layout({ userEmail, onLogout }) {
  return (
    <div className="app-shell">
      <header className="navbar">
        <div className="navbar-inner container">
          <NavLink to="/" className="navbar-logo">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#4F46E5" />
              <path d="M16 6L26 14V26H20V20H12V26H6V14L16 6Z" fill="white" />
            </svg>
            <span>Ivy Homes</span>
          </NavLink>

          <nav className="navbar-links">
            <NavLink to="/" end>
              Listings
            </NavLink>
            <NavLink to="/rentals">Rentals</NavLink>
            <NavLink to="/projects">Projects</NavLink>
            <NavLink to="/saved">Saved</NavLink>
            <NavLink to="/insights">Insights</NavLink>
          </nav>

          <div className="navbar-right">
            <span className="navbar-user">{userEmail}</span>
            <button className="btn btn-danger" id="logout-btn" onClick={onLogout}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <Outlet />
    </div>
  );
}
