import { useState } from "react";
import axios from 'axios';

function Login({ onLogin }) {
    const [formData, setFormData] = useState({
        login: '',
        password: '',
        memo: false
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({
            ...formData,
            [e.target.name]: value
        });
        //console.log(formData)
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.login || !formData.password) {
            setError('Please fill in all fields');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        try {
            const loginResponse = await fetch('http://localhost:4040/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: formData.login, password: formData.password })
            });

            if (!loginResponse.ok) {
                console.warn(loginResponse.status, loginResponse.json())
                setError('Login failed. Please check your credentials.');
                return;
            }

            const loginData = await loginResponse.json();

            if (formData.memo) {
                localStorage.setItem('token', `${loginData.tokenType} ${loginData.token}`)
            }

            const userResponse = await fetch('http://localhost:4040/api/users/c', {
                method: 'GET',
                headers: {
                    'Authorization': `${loginData.tokenType} ${loginData.token}`,
                    'Content-Type': 'application/json'
                },
            });

            if (!userResponse.ok) {
                console.warn(userResponse.status, userResponse.json())
                setError('ERROR: 1');
                return;
            }

            const userData = await userResponse.json();

            const roleResponse = await fetch('http://localhost:4040/api/auth/validate', {
                method: 'POST',
                headers: {
                    'Authorization': `${loginData.tokenType} ${loginData.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData.user)
            });

            if (!roleResponse.ok) {
                console.warn(roleResponse.status, roleResponse.json())
                setError('ERROR: 2');
                return;
            }

            onLogin(userData.user);
        } catch (error) {
            console.warn('ERROR:', error);
            setError('ERROR: 0', error);
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
                                    <div className="alert alert-danger alert-dismissible fade show" role="alert">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label htmlFor="login" className="form-label">
                                            Login
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control form-control-lg"
                                            id="login"
                                            name="login"
                                            value={formData.login}
                                            onChange={handleChange}
                                            placeholder=""
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label htmlFor="password" className="form-label">
                                            Password
                                        </label>
                                        <input
                                            type="password"
                                            className="form-control form-control-lg"
                                            id="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder=""
                                        />
                                    </div>

                                    <div className="mb-3 form-check">
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            id="memo"
                                            name="memo"
                                            checked={formData.memo}
                                            onChange={handleChange}
                                        />
                                        <label className="form-check-label" htmlFor="memo">
                                            Remember me
                                        </label>
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn btn-primary btn-lg w-100 mb-3"
                                    >
                                        Login
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