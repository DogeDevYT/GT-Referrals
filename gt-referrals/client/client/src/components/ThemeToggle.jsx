import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './ThemeToggle.css';

export default function ThemeToggle() {
  const { user } = useAuth();

  
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  
  useEffect(() => {
    if (user?.themePreference) {
      setIsDark(user.themePreference === 'dark');
    }
  }, [user]);

  
  const toggleTheme = async () => {
    const newMode = !isDark;
    setIsDark(newMode);

    if (user) {
      try {
        const endpoint = user.role === 'employee' 
          ? '/api/employees/me' 
          : '/api/jobseekers/me';

        
        const token = user.token || localStorage.getItem('gt_token'); 

        
        await axios.patch(
          endpoint, 
          { themePreference: newMode ? 'dark' : 'light' },
          {
            headers: {
              Authorization: `Bearer ${token}` 
            }
          }
        );
      } catch (err) {
        console.error("Couldn't save theme to database:", err);
      }
    }
  };

  return (
    <div className="theme-toggle-container">
      <div className="toggle-switch" onClick={toggleTheme}>
        
        <div className="toggle-knob">
          {isDark ? (
            <span className="toggle-icon">🌙</span>
          ) : (
            <span className="toggle-icon">☀️</span>
          )}
        </div>

        
        <span className="toggle-icon">☀️</span>
        <span className="toggle-icon">🌙</span>
      </div>
    </div>
  );
}