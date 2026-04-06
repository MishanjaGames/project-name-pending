import config from '../config/config';

const API_URL = config.API_URL;
const BASE_URL = API_URL.replace('/api', '');

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  if (!token) return {};
  return {
    'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
  };
}

export const courseService = {
  // 1. Get all public courses
  getAll: async () => {
    try {
      const response = await fetch(`${API_URL}/courses`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to fetch courses');

      const data = await response.json();
      const coursesList = data.data || data || [];

      return coursesList.map((c) => {
        const t0 = c.trans?.[0] || {};
        const thumbLink = c.links?.find(l => l.url);
        const thumbnail = thumbLink ? `${BASE_URL}${thumbLink.url}` : '';
        return {
          ...c,
          title:       c.title       || t0.title       || '',
          description: c.description || t0.description || '',
          skills:      c.skills      || t0.skills      || [],
          author:      c.userId?.nickname || 'Unknown',
          img:         thumbnail,
        };
      });
    } catch (error) {
      console.error('getAll courses error:', error);
      return [];
    }
  },

  // 2. Get one course by ID
  getById: async (id) => {
    try {
      const response = await fetch(`${API_URL}/courses/${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to fetch course');

      const data = await response.json();
      const c = data.data || data;
      const t0 = c.trans?.[0] || {};
      return {
        ...c,
        title:       c.title       || t0.title       || '',
        description: c.description || t0.description || '',
        skills:      c.skills      || t0.skills      || [],
      };
    } catch (error) {
      console.error(`getById error for ${id}:`, error);
      throw error;
    }
  },

  // 3. Create a new course
  create: async (courseData) => {
    try {
      const payload = {
        direction:  courseData.direction,
        level:      courseData.level,
        price:      Number(courseData.price) || 0,
        base_lang:  courseData.base_lang || 'en',
        courseType: courseData.courseType || 'SELF_TAUGHT',
        trans: [{
          title:       courseData.title       || '',
          description: courseData.description || '',
          skills:      courseData.skills || courseData.whatYouWillLearn || [],
        }],
        volumes: courseData.volumes || [],
        links:   courseData.links   || [],
      };

      const response = await fetch(`${API_URL}/courses`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create course';
        const responseText = await response.text();
        try { errorMessage = JSON.parse(responseText).message || errorMessage; }
        catch { errorMessage = responseText || errorMessage; }
        throw new Error(`Server Error (${response.status}): ${errorMessage}`);
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('create course error:', error);
      throw error;
    }
  },

  // 4. Update a course
  update: async (id, updatedData) => {
    try {
      const payload = updatedData.trans ? updatedData : {
        ...updatedData,
        trans: [{
          title:       updatedData.title       || '',
          description: updatedData.description || '',
          skills:      updatedData.skills      || [],
        }],
      };

      const response = await fetch(`${API_URL}/courses/${id}`, {
        method: 'PATCH',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to update course');
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('update course error:', error);
      throw error;
    }
  },

  // 5. Delete a course
  delete: async (id) => {
    try {
      const response = await fetch(`${API_URL}/courses/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to delete course');
      return true;
    } catch (error) {
      console.error('delete course error:', error);
      throw error;
    }
  },

  // 6. Upload thumbnail
  uploadThumbnail: async (courseId, file) => {
    if (!file) return null;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${API_URL}/courses/${courseId}/files?thumbnail=true`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });
      if (!response.ok) throw new Error(`Thumbnail upload failed: ${response.statusText}`);
      const data = await response.json();
      return data.data || null;
    } catch (error) {
      console.error('uploadThumbnail error:', error);
      throw error;
    }
  },

  // 7. Upload content files
  uploadContentFiles: async (courseId, files) => {
    if (!files || files.length === 0) return [];
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      const response = await fetch(`${API_URL}/courses/${courseId}/files/multiple`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });
      if (!response.ok) throw new Error(`Content files upload failed: ${response.statusText}`);
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('uploadContentFiles error:', error);
      throw error;
    }
  },
};