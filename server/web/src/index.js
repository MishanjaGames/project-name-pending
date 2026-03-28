import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';
import emailjs from '@emailjs/browser';

const EMAILJS_KEY = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;
if (EMAILJS_KEY) {
  emailjs.init(EMAILJS_KEY);
} else {
  console.warn('EmailJS public key not set. Check REACT_APP_EMAILJS_PUBLIC_KEY in .env');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();
