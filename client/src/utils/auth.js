export function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch (e) {
    return null;
  }
}

export function setUser(user) {
  // Гарантируем наличие поля id/_id (нужно в разных частях приложения)
  const idVal = user._id || user.id || user.email || ('u_' + Date.now());
  const normalized = { ...user, _id: idVal, id: idVal };
  localStorage.setItem('user', JSON.stringify(normalized));
}

export function promoteToTeacher() {
  const user = getUser();
  if (!user) throw new Error('No authenticated user');
  // Отмечаем пользователя как преподавателя для клиентских тестов. Реальная проверка делается на сервере.
  user.role = 'teacher';
  user.isTeacher = true;
  setUser(user);
  return user;
}

export function clearUser() {
  localStorage.removeItem('user');
}

export function isAuthenticated() {
  return !!getUser();
}
