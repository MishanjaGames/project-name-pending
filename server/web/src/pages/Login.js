import { useState } from 'react';
import apiClient from '../utils/axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4040/api';

function Login({ onLogin }) {
    const [formData, setFormData] = useState({ login: '', password: '', memo: false });
    const [error, setError]       = useState('');
    const [loading, setLoading]   = useState(false);

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData(p => ({ ...p, [e.target.name]: value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.login || !formData.password) { setError('Please fill in all fields'); return; }
        if (formData.password.length < 6) { setError('Password must be at least 6 characters'); return; }

        setLoading(true);
        try {
            // Step 1: login — get token
            const { data: loginData } = await apiClient.post('/auth/login', {
                email:    formData.login,
                password: formData.password,
            });

            const token = `${loginData.tokenType} ${loginData.token}`;
            if (formData.memo) localStorage.setItem('token', token);

            // Step 2: fetch current user profile
            const { data: userData } = await apiClient.get('/users/c', {
                headers: { Authorization: token },
            });

            onLogin(userData.user);
        } catch (err) {
            const msg = err.response?.data?.message;
            if (err.response?.status === 404 || err.response?.status === 401) {
                setError('Invalid email or password.');
            } else if (msg) {
                setError(msg);
            } else {
                setError('Network error. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-md-6 col-lg-4">
                        <div className="card shadow-lg border-0">
                            <div className="card-body p-5">
                                <div className="text-center mb-4">
                                    <h2 className="fw-bold text-secondary">Authorization</h2>
                                </div>

                                {error && (
                                    <div className="alert alert-danger" role="alert">{error}</div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label htmlFor="login" className="form-label">Login</label>
                                        <input type="text" className="form-control form-control-lg"
                                            id="login" name="login" value={formData.login}
                                            onChange={handleChange} placeholder="" />
                                    </div>

                                    <div className="mb-4">
                                        <label htmlFor="password" className="form-label">Password</label>
                                        <input type="password" className="form-control form-control-lg"
                                            id="password" name="password" value={formData.password}
                                            onChange={handleChange} placeholder="" />
                                    </div>

                                    <div className="mb-3 form-check">
                                        <input type="checkbox" className="form-check-input"
                                            id="memo" name="memo" checked={formData.memo}
                                            onChange={handleChange} />
                                        <label className="form-check-label" htmlFor="memo">Remember me</label>
                                    </div>

                                    <button type="submit" className="btn btn-primary btn-lg w-100 mb-3" disabled={loading}>
                                        {loading ? 'Logging in…' : 'Login'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
