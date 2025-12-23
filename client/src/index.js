import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext'; 
import { HighlightProvider } from './context/HighlightContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import store from './store';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>
    <BrowserRouter>
      <ToastProvider position="top-right">
        <AuthProvider>
          <ThemeProvider>
            <HighlightProvider>
              <App />
            </HighlightProvider>
          </ThemeProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </Provider>
);