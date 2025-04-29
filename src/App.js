import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TodoApp } from './components/TodoApp';
import AuthComponent from './components/AuthComponent';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState('');
  
  const API_URL = 'https://your-backend-api.com/api'; // Replace with your backend API URL

  // Check previous login status from backend
  useEffect(() => {
    const checkLoggedInStatus = async () => {
      try {
        const response = await axios.get(`${API_URL}/user`, { withCredentials: true }); // Check if a user is logged in
        if (response.data.username) {
          setIsLoggedIn(true);
          setCurrentUser(response.data.username);
        }
      } catch (error) {
        console.error("Error checking login status:", error);
      }
    };
    checkLoggedInStatus();
  }, []);

  // Handle login success
  const handleLogin = async (username) => {
    try {
      const response = await axios.post(`${API_URL}/login`, { username }, { withCredentials: true });
      if (response.data.success) {
        setIsLoggedIn(true);
        setCurrentUser(username);
      }
    } catch (error) {
      console.error("Error logging in:", error);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/logout`, {}, { withCredentials: true }); // Send logout request to backend
      setIsLoggedIn(false);
      setCurrentUser('');
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div className="App">
      {!isLoggedIn && <AuthComponent onLogin={handleLogin} />}
      
      {isLoggedIn && (
        <div className="app-wrapper">
          <div className="user-header">
            <p>Welcome, <span className="username">{currentUser}</span>!</p>
            <bu
