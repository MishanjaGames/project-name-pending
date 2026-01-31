import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Main from './pages/Main';
import Courses from './pages/Courses';
import Roles from './pages/Roles';
import Users from './pages/Users';
import Settings from './pages/Settings';

function App() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState({
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

          if (response.ok) {
            const data = await response.json();
            setUserData({
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
  }, []);

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
        <Route path="/courses" element={
          isLoggedIn ?
            <Courses data={userData} onLogout={handleLogout} /> :
            <Navigate to="/login" />
        } />
        <Route path="/roles" element={
          isLoggedIn ?
            <Roles data={userData} onLogout={handleLogout} /> :
            <Navigate to="/login" />
        } />
        <Route path="/users" element={
          isLoggedIn ?
            <Users data={userData} onLogout={handleLogout}/> :
            <Navigate to="/login" />
        } />
        <Route path="/settings" element={
          isLoggedIn ?
            <Settings data={userData} onLogout={handleLogout}/> :
            <Navigate to="/login" />
        } />
      </Routes>
    </div>
  );
}

export default App;