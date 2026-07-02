import React from 'react';

const Navbar = ({ user, onLogout }) => {
  return (
    <nav className="navbar">
      <a href="/" className="navbar-brand" onClick={(e) => e.preventDefault()}>
        Bistro Reservation System
      </a>

      {user && (
        <div className="navbar-links">
          <div className="nav-user">
            <span className="user-badge">
              {user.name} 
              <span className={`badge ${user.role === 'admin' ? 'admin-badge ml-2' : 'badge-success ml-2'}`} style={{ marginLeft: '8px' }}>
                {user.role}
              </span>
            </span>
            <button className="btn btn-secondary" onClick={onLogout} style={{ padding: '0.5rem 1rem' }}>
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
