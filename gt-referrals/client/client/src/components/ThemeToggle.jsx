import React, { useState, useEffect } from 'react';
import './ThemeToggle.css';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check local storage or document class on load
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  };

  return (
    <div className="theme-toggle-container">
      <div className="toggle-switch" onClick={toggleTheme}>
        {/* The Sliding Blue Circle */}
        <div className="toggle-knob">
          {isDark ? (
            <span className="toggle-icon">🌙</span>
          ) : (
            <span className="toggle-icon">☀️</span>
          )}
        </div>

        {/* The Icons in the background */}
        <span className="toggle-icon">☀️</span>
        <span className="toggle-icon">🌙</span>
      </div>
    </div>
  );
}