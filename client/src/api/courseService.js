const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
    return COURSES;
  },

  // Получить один курс по ID
  getById: async (id) => {
    await delay(400);
    return COURSES.find(c => String(c._id) === String(id));
  },

  // Создать курс
  create: async (courseData, user) => {
    await delay(1000);
    
    const newCourse = {
      _id: 'new_' + Date.now(),
      userId: { _id: user.id || 'me', nickname: user.name || user.nickname },
      status: 'editing', // По дефолту черновик
      title: courseData.title,
      description: courseData.description,
      direction: courseData.direction,
      level: courseData.level,
      price: Number(courseData.price),
      links: courseData.links ? (Array.isArray(courseData.links) ? courseData.links : courseData.links.split(',').map(s => s.trim())) : [],
      // teacher-defined learn list
      whatYouWillLearn: courseData.whatYouWillLearn || [],
      // support uploaded image/video data URLs in mock
      _tempVideos: courseData._tempVideos || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _tempImage: courseData._tempImage || 'https://via.placeholder.com/400x250?text=New+Course' 
    };

    COURSES.push(newCourse);
    console.log('Course created in Mock DB:', newCourse);
    return newCourse;
  },
  // Обновить курс
  update: async (id, updatedData) => {
    await delay(800);
    // Находим индекс курса в массиве
    const index = COURSES.findIndex(c => String(c._id) === String(id));
    
    if (index !== -1) {
      // Сохраняем старые данные и накладываем новые
      COURSES[index] = { 
        ...COURSES[index], 
        ...updatedData, 
        updatedAt: new Date().toISOString() // Обновляем дату изменения
      };
      return COURSES[index];
    }
    throw new Error('Course not found');
  },

  // Удалить курс
  delete: async (id) => {
    await delay(600);
    COURSES = COURSES.filter(c => String(c._id) !== String(id));
    return true;
  }
};