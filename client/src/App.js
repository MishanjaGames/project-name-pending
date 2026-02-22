import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import LoginPage from './pages/login/LoginPage';
import HomePage from './pages/home/HomePage';
import SignUpPage from './pages/register/RegisterPage';
import SearchPage from './pages/search/SearchPage';
import TeacherRegisterPage from './pages/register/TeacherRegisterPage';
import AddCoursePage from './pages/instructor/AddCoursePage';
import AccountPage from './pages/account/AccountPage';
import CartPage from './pages/cart/CartPage';
import SettingsPage from './pages/settings/SettingsPage';
import NavBar from './components/NavBar';
import CoursePage from './pages/course/CoursePage';
import EditCoursePage from './pages/course/EditCoursePage';
import ProtectedRoute from './components/ProtectedRoute';
import { SettingsProvider } from './contexts/SettingsContext';
import { CartProvider } from './contexts/CartContext';

function App() {
  return (
    <SettingsProvider>
      <CartProvider>
        <BrowserRouter>
          <NavBar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<SignUpPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/apply-teacher" element={<TeacherRegisterPage />} />
            <Route 
              path="/instructor/add-course" 
              element={
                <ProtectedRoute roleRequired="teacher">
                  <AddCoursePage />
                </ProtectedRoute>
              } 
            />
            <Route path="/course/:id" element={<CoursePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
            <Route 
              path="/instructor/edit-course/:id" 
              element={
                <ProtectedRoute roleRequired="teacher">
                  <EditCoursePage />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </SettingsProvider>
  );
}

export default App;