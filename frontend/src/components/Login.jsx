import React, { useState } from 'react';
import { API_BASE_URL } from '../config';

const Login = ({ onLoginSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer'); // Default to customer register
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isRegistering ? '/auth/register' : '/auth/login';
    const payload = isRegistering 
      ? { name, email, password, role } 
      : { email, password };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed. Please try again.');
      }

      onLoginSuccess(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper glass-card">
      <h2 className="text-center">{isRegistering ? 'Create Account' : 'Sign In'}</h2>
      
      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {isRegistering && (
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="John Doe"
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="name@example.com"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
        </div>

        {isRegistering && (
          <div className="form-group">
            <label htmlFor="role">Account Type</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="customer">Customer</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
        )}

        <button 
          type="submit" 
          className="btn btn-primary" 
          style={{ width: '100%', marginTop: '1rem' }}
          disabled={loading}
        >
          {loading ? 'Processing...' : isRegistering ? 'Register' : 'Login'}
        </button>
      </form>

      <div className="auth-toggle">
        {isRegistering ? (
          <>
            Already have an account?
            <button 
              className="auth-toggle-btn" 
              onClick={() => { setIsRegistering(false); setError(''); }}
            >
              Login here
            </button>
          </>
        ) : (
          <>
            New to Restaurant Reservation?
            <button 
              className="auth-toggle-btn" 
              onClick={() => { setIsRegistering(true); setError(''); }}
            >
              Create an account
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
