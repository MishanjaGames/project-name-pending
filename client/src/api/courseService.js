const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4040/api';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Получить токен из localStorage
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No auth token found');
  }
  return {
    'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
  };
}

// Загрузка thumbnail
async function uploadThumbnail(courseId, file) {
  if (!file) return null;
  
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/manage/courses/${courseId}/files`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || null;
  } catch (error) {
    console.error('uploadThumbnail error:', error);
    throw error;
  }
}

// Загрузка контент файлов (multiple)
async function uploadContentFiles(courseId, files) {
  if (!files || files.length === 0) return [];
  
  try {
    const formData = new FormData();
    files.forEach((file, idx) => {
      formData.append('files', file, file.name || `file_${idx}`);
    });

    const response = await fetch(`${API_URL}/manage/courses/${courseId}/files/multiple`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('uploadContentFiles error:', error);
    throw error;
  }
}

// Преобразуем курс для UI: если пришёл links-объект — заполняем _tempVideos/_tempImage
function normalizeCourseForUI(course) {
  if (!course) return course;
  const copy = { ...course };
  if (Array.isArray(copy.links) && copy.links.length > 0 && typeof copy.links[0] === 'object') {
    copy._tempVideos = copy.links.filter(l => l.type === 'video').map(l => l.url);
    const img = copy.links.find(l => l.type === 'image');
    if (img && img.url) copy._tempImage = img.url;
  }
  copy._tempVideos = copy._tempVideos || [];
  copy._tempImage = copy._tempImage || 'https://via.placeholder.com/400x250?text=Course';
  return copy;
}

let COURSES = [
  // --- КУРСЫ ---
  { 
    _id: '1',
    userId: { _id: 'u1', nickname: 'Yuri Popov' }, 
    status: 'deployed',
    title: 'C++: Complete Guide', 
    description: 'Complete C++ guide covering STL, OOP, and Memory Management. Ideal for beginners and intermediate developers.',
    direction: 'Programming', 
    level: 'junior', 
    price: 10.99, 
    links: ['https://youtube.com/cpp-intro'],
    _tempImage: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=500&q=80',
    createdAt: new Date().toISOString()
  },
  { 
    _id: '2', 
    userId: { _id: 'u2', nickname: 'Anna Ivanova' }, 
    status: 'deployed',
    title: 'Full JavaScript Course', 
    description: 'Modern JavaScript from scratch. Learn ES6+, React basics, and asynchronous programming.',
    direction: 'Programming', 
    level: 'middle', 
    price: 9.99, 
    links: [],
    _tempImage: 'https://cdn.cases.media/image/wide/a48810a2-e1fc-4ccd-ba88-9fcf143f3855.png',
    createdAt: new Date().toISOString()
  },
  { 
    _id: '3', 
    userId: { _id: 'u3', nickname: 'John Doe' }, 
    status: 'deployed',
    title: 'Python for Data Science', 
    description: 'Learn to analyze data with Python, Pandas, and Matplotlib.',
    direction: 'Data Science', 
    level: 'senior', 
    price: 12.99, 
    links: [],
    _tempImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&q=80',
    createdAt: new Date().toISOString()
  },
  { 
    _id: '4', 
    userId: { _id: 'u4', nickname: 'Roman S' }, 
    status: 'deployed',
    title: 'Java Masterclass', 
    description: 'Master Java for enterprise applications.',
    direction: 'Programming', 
    level: 'junior', 
    price: 9.99, 
    links: [],
    _tempImage: 'https://images.unsplash.com/photo-1532619675605-1ede6c2ed2b0?w=500&q=80',
    createdAt: new Date().toISOString()
  },
  { 
    _id: '5', 
    userId: { _id: 'u1', nickname: 'Yuri Popov' }, 
    status: 'deployed',
    title: 'Unreal Engine - C++', 
    description: 'Game development with UE5 and C++.',
    direction: 'Game Dev', 
    level: 'middle', 
    price: 10.99, 
    links: [],
    _tempImage: 'https://tse2.mm.bing.net/th/id/OIP.xi-iuyaQmrP-0VFlB3mfZgHaEK?rs=1&pid=ImgDetMain&o=7&rm=3',
    createdAt: new Date().toISOString()
  },
  { 
    _id: '6', 
    userId: { _id: 'u5', nickname: 'Anvar Abdusatarov' }, 
    status: 'deployed',
    title: 'Unity 2D Platformer', 
    description: 'Create your first 2D platformer game.',
    direction: 'Game Dev', 
    level: 'junior', 
    price: 9.99, 
    links: [],
    _tempImage: 'https://th.bing.com/th/id/R.3d74254da9870098646ac98726cd6924?rik=C7cRmg4v7F5iYA&pid=ImgRaw&r=0',
    createdAt: new Date().toISOString()
  },

  // --- ТЕСТОВЫЕ КУРСЫ  ---
  {
    _id: '65a123abc456', 
    userId: { _id: 'u1', nickname: 'Yuri Popov' },
    status: 'deployed',
    title: 'Advanced C++ Architecture',
    description: 'Deep dive into software architecture.',
    direction: 'Programming',
    level: 'senior',
    price: 15.99,
    links: ['https://youtube.com/video1'],
    _tempImage: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=500&q=80',
    createdAt: new Date().toISOString()
  }
];

export const courseService = {
  // Получить все курсы
  getAll: async () => {
    await delay(600);
    return COURSES.map(normalizeCourseForUI);
  },

  // Получить один курс по ID
  getById: async (id) => {
    await delay(400);
    const found = COURSES.find(c => String(c._id) === String(id));
    return normalizeCourseForUI(found);
  },

  // Создать курс (только курс, без файлов)
  create: async (courseData, user) => {
    await delay(500);
    
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const payload = {
        userId: user.id || user._id,
        title: courseData.title,
        description: courseData.description,
        direction: courseData.direction,
        level: courseData.level,
        price: Number(courseData.price),
        skills: courseData.whatYouWillLearn || [],
        status: 'draft'
      };

      const response = await fetch(`${API_URL}/manage/courses`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create course');
      }

      const data = await response.json();
      const newCourse = data.data;

      // Fallback: добавляем в локальный список если нет подключения к реальному бэку
      if (newCourse && newCourse._id) {
        COURSES.push({
          ...newCourse,
          links: newCourse.links || [],
          _tempImage: 'https://via.placeholder.com/400x250?text=New+Course',
          _tempVideos: []
        });
      }

      return newCourse;
    } catch (error) {
      console.error('create course error:', error);
      throw error;
    }
  },
  // Обновить курс
  update: async (id, updatedData) => {
    await delay(800);
    // Находим индекс курса в массиве
    const index = COURSES.findIndex(c => String(c._id) === String(id));
    if (index === -1) throw new Error('Course not found');

    // Файлы загружаются отдельно через uploadThumbnail и uploadContentFiles
    // Здесь только обновляем данные курса

    // Сохраняем старые данные и накладываем новые
    COURSES[index] = {
      ...COURSES[index],
      ...updatedData,
      updatedAt: new Date().toISOString()
    };

    return normalizeCourseForUI(COURSES[index]);
  },

  // Удалить курс
  delete: async (id) => {
    await delay(600);
    COURSES = COURSES.filter(c => String(c._id) !== String(id));
    return true;
  },

  // Загрузить thumbnail
  uploadThumbnail: async (courseId, file) => {
    return uploadThumbnail(courseId, file);
  },

  // Загрузить контент файлы
  uploadContentFiles: async (courseId, files) => {
    return uploadContentFiles(courseId, files);
  }
};