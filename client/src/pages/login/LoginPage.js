import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { setUser } from '../../utils/auth';
import { SettingsContext } from '../../contexts/SettingsContext';

function LoginPage() {
  const navigate = useNavigate();
  const { t } = useContext(SettingsContext);
  
  // ИЗМЕНЕНИЕ 1: Теперь это универсальное поле (логин или email)
  const [loginId, setLoginId] = useState(''); 
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      // Отправляем на бэкенд. 
      // Пока что шлем под ключом email, так как бэкенд Миши, скорее всего, ждет именно его.
      const response = await fetch('http://localhost:4040/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginId, password }) 
      });

      if (!response.ok) {
        let errorMessage = 'Login failed';
        const text = await response.text();
        try {
          errorMessage = JSON.parse(text).message || errorMessage;
        } catch (err) {
          errorMessage = text || errorMessage;
        }
        throw new Error(`Server returned ${response.status}: ${errorMessage}`);
      }

      const data = await response.json();
      const token = data.token; 
      
      if (!token) throw new Error('No token received');

      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jwtPayload = JSON.parse(window.atob(base64));
      
      let userRole = 'default'; 
      
      if (jwtPayload.role && jwtPayload.role.accessLevel) {
        userRole = jwtPayload.role.accessLevel;
      } else if (typeof jwtPayload.role === 'string' && !/^[0-9a-fA-F]{24}$/.test(jwtPayload.role)) {
        userRole = jwtPayload.role;
      }

      // ИЗМЕНЕНИЕ 2: Добавили твои данные в "белый список" админов!
      if (userRole === 'default') {
        const lowerLogin = loginId.toLowerCase();
        if (lowerLogin.includes('creator')) userRole = 'create';
        else if (lowerLogin.includes('manager')) userRole = 'manage';
        else if (lowerLogin.includes('admin') || lowerLogin === 'nikita11b' || lowerLogin === 'bond.n@gmail.com') {
            userRole = 'admin'; // Даем права админа Никите!
        }
        else if (lowerLogin.includes('root')) userRole = 'root';
      }

      const userData = {
        id: jwtPayload.userId || jwtPayload._id,
        email: jwtPayload.email || loginId,
        role: userRole,
        name: jwtPayload.nickname || loginId.split('@')[0], 
        enrolled: []
      };

      setUser(userData, token);
      navigate('/account'); // Пусть после логина сразу кидает в профиль, так удобнее!
      
    } catch (error) {
      console.error('Login error:', error);
      alert(`Ошибка входа: ${error.message}`);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 page-bg">
      <div className="card shadow-lg" style={{ width: '100%', maxWidth: '450px', borderRadius: '15px' }}>
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <h2 className="fw-bold mb-2">Welcome Back</h2>
            <p className="text-muted">Please login to your account</p>
          </div>
          
          <div className="mb-3">
            {/* ИЗМЕНЕНИЕ 3: Поменяли текст и type="email" на type="text" */}
            <label htmlFor="loginId" className="form-label">Email or Nickname</label>
            <input
              type="text" 
              className="form-control form-control-lg"
              id="loginId"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="nikita11B or email@..."
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              className="form-control form-control-lg"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            onClick={handleLogin}
            className="btn btn-primary btn-lg w-100 mb-3"
            style={{ borderRadius: '10px' }}
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;