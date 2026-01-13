import { getUser } from './auth';

/**
 * submitTeacherApplication
 * Expects a FormData instance with the fields/files described in the form.
 * POST /api/teacher-applications
 * Returns parsed JSON on success, throws Error on failure.
 *
 * Backend expectations / notes for integration:
 * - Accept multipart/form-data
 * - Validate required fields server-side (name, email, bio, cert, id)
 * - Save files to secure storage (S3/Cloud storage or server FS) and store references
 * - Set application status: pending -> admin can change to approved/rejected
 * - Return meaningful errors e.g. { message: 'File too large' }
 */
export async function submitTeacherApplication(formData) {
  const headers = {};
  // attach authorization if available
  try {
    const user = getUser();
    if (user && user.token) headers['Authorization'] = `Bearer ${user.token}`;
  } catch (e) {
    // ignore
  }

  const res = await fetch('/api/teacher-applications', {
    method: 'POST',
    headers, // Do NOT set Content-Type for FormData
    body: formData,
  });

  if (!res.ok) {
    let body = null;
    try { body = await res.json(); } catch (e) { /* ignore */ }
    throw new Error(body?.message || `Server error: ${res.status}`);
  }

  return res.json();
}
