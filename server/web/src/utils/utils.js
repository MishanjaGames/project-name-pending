import { useCallback, useEffect, useRef } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4040/api';

// Hook: runs callback after `delay` ms, with reset/clear controls
export function useTimeout(callback, delay) {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef();

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const set = useCallback(() => {
    timeoutRef.current = setTimeout(() => callbackRef.current(), delay);
  }, [delay]);

  const clear = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  useEffect(() => {
    set();
    return clear;
  }, [delay, set, clear]);

  const reset = useCallback(() => {
    clear();
    set();
  }, [clear, set]);

  return { reset, clear };
}

export const saveToken = (token) => {
  localStorage.setItem('token', token);
};

export const getToken = () => {
  return localStorage.getItem('token');
};

export const removeToken = () => {
  localStorage.removeItem('token');
};

export const extendSession = async (data) => {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const [tokenType, tokenValue] = token.split(' ');
    const response = await fetch(`${API_URL}/auth/ext-session`, {
      method: 'POST',
      headers: {
        Authorization: `${tokenType} ${tokenValue}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data }),
    });

    if (response.ok) {
      const result = await response.json();
      localStorage.removeItem('token');
      localStorage.setItem('token', `${result.tokenType} ${result.token}`);
    }
  } catch (err) {
    console.error('Failed to extend session:', err);
  }
};

export const isAuthenticated = () => {
  return Boolean(getToken());
};

// Converts seconds into a human-readable duration string
export const formatUptime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0s';

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (days === 0) parts.push(`${secs}s`);

  return parts.length > 0 ? parts.join(' ') : '0s';
};

// Formats a timestamp into a readable date string
export const formatLaunchTime = (timestamp) => {
  if (!timestamp) return 'Unknown';

  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Invalid date';

    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch (err) {
    console.error('Error formatting launch time:', err);
    return 'Error formatting date';
  }
};

// Returns a "X time ago" string from a timestamp
export const getTimeAgo = (timestamp) => {
  if (!timestamp) return 'Unknown';

  try {
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const diffSeconds = Math.floor(diffMs / 1000);

    if (diffSeconds < 60) return 'Just now';

    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;

    const diffYears = Math.floor(diffMonths / 12);
    return `${diffYears} year${diffYears !== 1 ? 's' : ''} ago`;
  } catch (err) {
    console.error('Error calculating time ago:', err);
    return 'Unknown';
  }
};
