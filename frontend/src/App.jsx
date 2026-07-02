import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Login from './components/Login';
import CustomerDashboard from './components/CustomerDashboard';
import AdminDashboard from './components/AdminDashboard';
import { API_BASE_URL } from './config';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (token) {
      validateToken();
    } else {
      setInitializing(false);
    }
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setUser(data);
      } else {
        // Token invalid or expired
        handleLogout();
      }
    } catch (error) {
      console.error('Error validating token:', error.message);
      handleLogout();
    } finally {
      setInitializing(false);
    }
  };

  const handleLoginSuccess = (newToken, loggedInUser) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
  };

  if (initializing) {
    return (
      <div className="app-container">
        <Navbar />
        <main className="main-content text-center" style={{ marginTop: '5rem' }}>
          <h3>Loading Application Session...</h3>
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar user={user} onLogout={handleLogout} />
      
      <main className="main-content">
        {!user ? (
          <Login onLoginSuccess={handleLoginSuccess} />
        ) : user.role === 'admin' ? (
          <AdminDashboard token={token} />
        ) : (
          <CustomerDashboard token={token} />
        )}
      </main>
    </div>
  );
}

export default App;
