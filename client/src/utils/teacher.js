
/**
 * submitTeacherApplication
 * Ожидает FormData с полями/файлами формы.
 * POST /api/teacher-applications
 * Возвращает JSON при успехе, выбрасывает Error при ошибке.
 *
 * Заметки для интеграции с бэком:
 * - Принимать multipart/form-data
 * - Валидировать обязательные поля на сервере (name, email, bio, cert, id)
 * - Сохранять файлы в безопасное хранилище и хранить ссылки
 * - Устанавливать статус заявки: pending -> approved/rejected
 * - Возвращать понятные ошибки, например { message: 'File too large' }
 */
export async function submitTeacherApplication(formData) {
  const headers = {};
  try {
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  } catch (e) {
    // ignore
  }

  const res = await fetch('/api/forms/apply/creator', {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!res.ok) {
    let body = null;
    try { body = await res.json(); } catch (e) { /* ignore */ }
    throw new Error(body?.message || `Server error: ${res.status}`);
  }

  return res.json();
}
