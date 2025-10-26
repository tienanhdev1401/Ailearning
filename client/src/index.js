import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; 
import { HighlightProvider } from './context/HighlightContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <AuthProvider>
      <HighlightProvider>
        <App />
      </HighlightProvider>
    </AuthProvider>
  </BrowserRouter>
);