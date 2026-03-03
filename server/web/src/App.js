import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { extendSession } from "./utils/utils";

import Login from './pages/Login';
import Main from './pages/Main';
import Courses from './pages/Courses';
import Directions from './pages/Directions';
import Levels from './pages/Levels';
import Roles from './pages/Roles';
import Users from './pages/Users';
import Settings from './pages/Settings';
import CreateDirection from './pages/CreateDirection';
import CreateLevel from './pages/CreateLevel';
import CreateUser from './pages/CreateUser';
import CreateRole from './pages/CreateRole';
import CreateCourse from './pages/CreateCourse';
import EditDirection from './pages/EditDirection';
import EditLevel from './pages/EditLevel';
import EditUser from './pages/EditUser';
import EditRole from './pages/EditRole';
import EditCourse from './pages/EditCourse';
import CoursePreview from './pages/CoursePreview';
import ViewCourse from './pages/ViewCourse';
import CreatorForm from './pages/CreatorForm';
import Forms from './pages/Forms';
import ViewForm from './pages/ViewForm';

function App() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState({
    id: '',
    nickname: '',
    email: '',
    role: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      const fetchUserData = async () => {
        try {
          const response = await fetch('http://localhost:4040/api/users/c', {
            method: 'GET',
            headers: {
              'Authorization': `${token.split(' ')[0]} ${token.split(' ')[1]}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.status === 401) {
            await extendSession(userData)
          }

          if (response.ok) {
            const data = await response.json();
            setUserData({
              _id: data.user._id,
              nickname: data.user.nickname,
              email: data.user.email,
              role: data.user.role
            });
            setIsLoggedIn(true);
          } else {
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          localStorage.removeItem('token');
        }
      };

      fetchUserData();
    }
  }, [isLoggedIn]);

  const handleLogin = (user) => {
    setUserData({
      nickname: user.nickname,
      email: user.email,
      role: user.role
    });
    setIsLoggedIn(true);
    navigate('/');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserData({
      nickname: '',
      email: '',
      role: ''
    });
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="App">
      <Routes>
        {/* Login Route */}
        <Route path="/login" element={
          !isLoggedIn ?
            <Login onLogin={handleLogin} /> :
            <Navigate to="/" />
        } />

        <Route path="/" element={
          isLoggedIn ?
            <Main data={userData} onLogout={handleLogout} /> :
            <Navigate to="/login" />
        } />

        {/* Forms */}
        <Route path="/creator/apply" element={
          isLoggedIn ?
            <CreatorForm formType={'creator'} data={userData} onLogout={handleLogout} /> :
            <Navigate to="/login" />
        } />
        <Route path="/manage/forms/" element={
          isLoggedIn ?
            <Forms data={userData} onLogout={handleLogout} /> :
            <Navigate to="/login" />
        } />
        <Route path="/manage/forms/detail/:id" element={
          isLoggedIn ?
            <ViewForm data={userData} onLogout={handleLogout} /> :
            <Navigate to="/login" />
        } />

        {/* Courses Routes */}
        <Route path="/manage/courses" element={
          isLoggedIn ?
            <Courses data={userData} onLogout={handleLogout} /> :
            <Navigate to="/login" />
        } />
        <Route path="/manage/courses/create" element={
          isLoggedIn ?
            <CreateCourse data={userData} onLogout={handleLogout} /> :
            <Navigate to="/login" />
        } />
        <Route path="/manage/course/:id" element={
          isLoggedIn ?
            <EditCourse data={userData} onLogout={handleLogout} /> :
            <Navigate to="/login" />
        } />
        <Route path="/manage/course/preview/:id" element={
          isLoggedIn ?
            <CoursePreview data={userData} onLogout={handleLogout} /> :
            <Navigate to="/login" />
        } />
        <Route path="/course/view/:id" element={
          isLoggedIn ?
            <ViewCourse data={userData} onLogout={handleLogout} /> :
            <Navigate to="/login" />
        } />
        {/* Settings Route */}
        <Route path="/manage/settings" element={
          isLoggedIn ?
            <Settings data={userData} onLogout={handleLogout} /> :
            <Navigate to="/login" />
        } />

        {/* Directions Routes */}
        <Route path="/manage/directions" element={
          isLoggedIn ?
            <Directions data={userData} onLogout={handleLogout} /> :
            <Navigate to="/login" />
        } />
        <Route path="/manage/directions/create" element={
          isLoggedIn ?
            <CreateDirection data={userData} onLogout={handleLogout} /> :
            <Navigate to="/login" />
        } />
        <Route path="/manage/direction/:id" element={
          isLoggedIn ?
            <EditDirection data={userData} onLogout={handleLogout} /> :
            <Navigate to="/login" />
        } />

        {/* Levels Routes */}
        <Route path="/manage/levels" element={
          isLoggedIn ?
            <Levels data={userData} onLogout={handleLogout} /> :
            <Navigate to="/login" />
        } />
        <Route path="/manage/levels/create" element={
          isLoggedIn ?
            <CreateLevel data={userData} onLogout={handleLogout} /> :
            <Navigate to="/login" />
        } />
        <Route path="/manage/level/:id" element={
          isLoggedIn ?
            <EditLevel data={userData} onLogout={handleLogout} /> :
            <Navigate to="/login" />
        } />

        {/* Users Routes */}
        <Route path="/manage/users" element={
          isLoggedIn ?
            <Users data={userData} onLogout={handleLogout} /> :
            <Navigate to="/login" />
        } />
        <Route path="/manage/users/create" element={
          isLoggedIn ?
            <CreateUser data={userData} onLogout={handleLogout} /> :
            <Navigate to="/login" />
        } />
        <Route path="/manage/user/:id" element={
          isLoggedIn ?
            <EditUser data={userData} onLogout={handleLogout} /> :
            <Navigate to="/login" />
        } />

        {/* Roles Routes */}
        <Route path="/manage/roles" element={
          isLoggedIn ?
            <Roles data={userData} onLogout={handleLogout} /> :
            <Navigate to="/login" />
        } />
        <Route path="/manage/roles/create" element={
          isLoggedIn ?
            <CreateRole data={userData} onLogout={handleLogout} /> :
            <Navigate to="/login" />
        } />
        <Route path="/manage/role/:id" element={
          isLoggedIn ?
            <EditRole data={userData} onLogout={handleLogout} /> :
            <Navigate to="/login" />
        } />

        <Route path="*" element={<Navigate to={isLoggedIn ? "/" : "/login"} />} />
      </Routes>
    </div>
  );
}

export default App;