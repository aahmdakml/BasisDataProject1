import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../App.css';

const AuthComponent = ({ onLogin }) => {
  // States
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  const API_URL = 'https://your-backend-api.com/api'; // Replace with your backend API URL

  // Fetch users from backend
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${API_URL}/users`); // Fetch users
        setUsers(response.data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

  // Register user
  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required');
      return;
    }
    
    // Check if username exists
    if (users.some(user => user.username === username)) {
      setError('Username exists');
      return;
    }
    
    // Register new user
    try {
      const newUser = { username, password };
      const response = await axios.post(`${API_URL}/register`, newUser); // POST the new user to backend
      setUsers([...users, response.data]);

      setUsername('');
      setPassword('');
      setError('Registration successful!');

      // Switch to login form after successful registration
      setTimeout(() => {
        setError('');
        setIsLogin(true);
      }, 1500);
    } catch (error) {
      console.error("Error registering user:", error);
      setError('Error registering user');
    }
  };

  // Login user
  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required');
      return;
    }
    
    try {
      const user = users.find(user => user.username === username && user.password === password);
      
      if (user) {
        setError('');
        onLogin(user.username); // Call onLogin to pass the username to the parent component
      } else {
        setError('Invalid credentials');
      }
    } catch (error) {
      console.error("Error logging in:", error);
      setError('Error logging in');
    }
  };

  // Select user for password verification
  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setUsername(user.username);
  };

  // Delete user
  const handleDeleteUser = async (e, usernameToDelete) => {
    e.stopPropagation(); // Prevent triggering user selection

    try {
      await axios.delete(`${API_URL}/users/${usernameToDelete}`); // DELETE the user from backend
      setUsers(users.filter(user => user.username !== usernameToDelete)); // Update local user list
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  // Verify password for the selected user
  const handleVerifyUser = async (e) => {
    e.preventDefault();

    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    if (selectedUser.password === password) {
      setError('');
      onLogin(selectedUser.username);
    } else {
      setError('Invalid password');
    }
  };

  // Toggle between login and register forms
  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setUsername('');
    setPassword('');
    setSelectedUser(null);
  };

  const renderRegisterForm = () => (
    <form onSubmit={handleRegister} className="auth-form">
      <h2>Create Account</h2>
      <div className="form-group">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          className="auth-input"
        />
      </div>
      <div className="form-group">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="auth-input"
        />
      </div>
      {error && <p className="auth-error">{error}</p>}
      <button type="submit" className="auth-button">Register</button>
      <p className="auth-toggle">
        Already have an account? <span onClick={toggleAuthMode}>Login</span>
      </p>
    </form>
  );

  const renderLoginForm = () => {
    if (selectedUser) {
      return (
        <form onSubmit={handleVerifyUser} className="auth-form">
          <h2>Enter Password</h2>
          <p className="selected-user">for {selectedUser.username}</p>
          <div className="form-group">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="auth-input"
            />
          </div>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="auth-button">Login</button>
          <button 
            type="button" 
            className="auth-button secondary"
            onClick={() => setSelectedUser(null)}
          >
            Back
          </button>
        </form>
      );
    }

    return (
      <div className="auth-form">
        <h2>Login</h2>
        
        {users.length > 0 ? (
          <>
            <div className="user-list">
              {users.map((user, index) => (
                <div key={index} className="user-button-container">
                  <button
                    className="user-button"
                    onClick={() => handleUserSelect(user)}
                  >
                    {user.username}
                    <span 
                      className="user-delete-text"
                      onClick={(e) => handleDeleteUser(e, user.username)}
                      title="Delete user"
                    >
                      ✕
                    </span>
                  </button>
                </div>
              ))}
            </div>
            <p className="or-divider">or</p>
          </>
        ) : null}
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="auth-input"
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="auth-input"
            />
          </div>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="auth-button">Login</button>
        </form>
        
        <p className="auth-toggle">
          Need an account? <span onClick={toggleAuthMode}>Register</span>
        </p>
      </div>
    );
  };

  return (
    <div className="auth-overlay">
      <div className="auth-container">
        {isLogin ? renderLoginForm() : renderRegisterForm()}
      </div>
    </div>
  );
};

export default AuthComponent;
