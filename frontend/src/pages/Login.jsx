import React, { useState ,useRef,useEffect} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import './Login.css';
import axios from 'axios';
import api from '../api';
const Login = () => {
    const navigate = useNavigate();
    const emailRef = useRef(null);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    useEffect(() => {
        if (emailRef.current) {
            emailRef.current.focus();
        }
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');
        try {
            const response = await axios.post(`${api}/api/auth/login`, formData, { withCredentials: true });
            const token = response?.data?.token;
            if (!token) {
                setError('The server did not return an authentication token.');
                return;
            }
            localStorage.setItem('Token', token);
            localStorage.removeItem('AdminToken');
            setSuccess('✓ Login successful! Redirecting...');
            navigate(response.data.role === 'ADMIN'
                ? '/admin/admin-dashboard'
                : '/student/student-dashboard');
        } catch (error) {
            setError(error.response?.data?.message || 'Invalid credentials. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <Link to="/" className="auth-logo">
                        Heaven  <span className="text-gradient">Hostels</span>
                    </Link>
                    <h1 className="auth-title">Welcome Back</h1>
                    <p className="auth-subtitle">Login to continue</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="Enter your registered email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="form-input"
                            ref={emailRef}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <div className="password-input-wrapper">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                name="password"
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="form-input"
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {success && <div className="success-message">{success}</div>}
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" className="btn-auth" disabled={isLoading}>
                        {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Need an account?{' '}
                        <Link to="/auth/register" className="auth-link">
                            Create one
                        </Link>
                    </p>
                    <p>
                        Forgot your password?{' '}
                        <Link to="/auth/forgot-password" className="auth-link">
                            Reset it
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
