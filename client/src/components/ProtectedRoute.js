import { Navigate } from 'react-router-dom';
import { getUser } from '../utils/auth';

const ProtectedRoute = ({ children, roleRequired }) => {
  const user = getUser();

  // Если юзер не залогинен
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Если роль не совпадает - на главную
  if (roleRequired && user.role !== roleRequired) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;