export function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch (e) {
    return null;
  }
}

export function setUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearUser() {
  localStorage.removeItem('user');
}

export function isAuthenticated() {
  return !!getUser();
}
