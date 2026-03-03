import { useCallback, useEffect, useRef } from "react"

export function useTimeout(callback, delay) {
  const callbackRef = useRef(callback)
  const timeoutRef = useRef()
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])
  const set = useCallback(() => {
    timeoutRef.current = setTimeout(() => callbackRef.current(), delay)
  }, [delay])
  const clear = useCallback(() => {
    timeoutRef.current && clearTimeout(timeoutRef.current)
  }, [])
  useEffect(() => {
    set()
    return clear
  }, [delay, set, clear])
  const reset = useCallback(() => {
    clear()
    set()
  }, [clear, set])
  return { reset, clear }
}

export const saveToken = (token) => {
  localStorage.setItem("token", token);
};

export const getToken = () => {
  return localStorage.getItem("token");
};

export const removeToken = () => {
  localStorage.removeItem("token");
};

export const extendSession = async (data) => {
  const token = localStorage.getItem('token')
  const req = await fetch('http://localhost:4040/api/auth/ext-session', {
    method: 'POST',
    headers: {
      'Authorization': `${token.split(' ')[0]} ${token.split(' ')[1]}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ data })
  });
  if (req.ok) {
    const data = await req.json();
    localStorage.removeItem('token')
    localStorage.setItem('token', `${data.tokenType} ${data.token}`)
  }
}

export const isAuthenticated = () => {
  const token = getToken();
  if (token) {
    return true;
  }
  return false;
}

// Format uptime from seconds to human-readable format
export const formatUptime = (seconds) => {
  if (!seconds || isNaN(seconds)) {
    return '0s';
  }

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];

  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs >= 0 && days === 0) parts.push(`${secs}s`); // Only show seconds if less than a day

  return parts.length > 0 ? parts.join(' ') : '0s';
};

// Format launch time to readable date/time
export const formatLaunchTime = (timestamp) => {
  if (!timestamp) {
    return 'Unknown';
  }

  try {
    const date = new Date(timestamp);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    // Format: "Jan 31, 2026 at 14:30:45"
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    };

    return date.toLocaleString('en-US', options);
  } catch (error) {
    console.error('Error formatting launch time:', error);
    return 'Error formatting date';
  }
};

// Get time ago format (alternative for launch time)
export const getTimeAgo = (timestamp) => {
  if (!timestamp) {
    return 'Unknown';
  }

  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffSeconds = Math.floor(diffMs / 1000);

    if (diffSeconds < 60) {
      return 'Just now';
    }

    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    }

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }

    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) {
      return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
    }

    const diffYears = Math.floor(diffMonths / 12);
    return `${diffYears} year${diffYears !== 1 ? 's' : ''} ago`;
  } catch (error) {
    console.error('Error calculating time ago:', error);
    return 'Unknown';
  }
};
