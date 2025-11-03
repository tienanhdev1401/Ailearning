import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; 
import { HighlightProvider } from './context/HighlightContext';
import { ThemeProvider } from './context/ThemeContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <AuthProvider>
      <ThemeProvider>
        <HighlightProvider>
          <App />
        </HighlightProvider>
      </ThemeProvider>
    </AuthProvider>
  </BrowserRouter>
);