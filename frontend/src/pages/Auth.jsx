import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus, AlertCircle } from 'lucide-react';
import '../styles/Auth.css';

const AuthPage = ({ initialMode = 'login' }) => {
    const [isLogin, setIsLogin] = useState(initialMode === 'login');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, register } = useAuth();
    const navigate = useNavigate();

    const getErrorMessage = (err, fallback) => {
        if (!err.response) {
            return 'Cannot connect to backend server. Please verify your backend is running and VITE_API_URL is properly configured.';
        }
        const data = err.response.data;
        if (data?.detail) {
            if (Array.isArray(data.detail)) {
                return data.detail.map((d) => d.msg || d.detail || JSON.stringify(d)).join(', ');
            }
            return typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
        }
        if (typeof data === 'string' && (data.includes('<!DOCTYPE') || data.includes('<html'))) {
            return 'Backend returned HTML instead of JSON. Check your VITE_API_URL configuration.';
        }
        if (err.response.status === 404) {
            return 'Auth endpoint not found (404). Please verify your backend API URL.';
        }
        if (err.response.status === 500) {
            return 'Backend server error (500). Please check backend database and logs.';
        }
        return fallback;
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        try {
            setError('');
            setLoading(true);
            await login(username.trim(), password);
            navigate('/app');
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to log in. Please check your credentials.'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        try {
            setError('');
            setLoading(true);
            await register(email.trim(), username.trim(), password);
            navigate('/app');
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to create account. Please check your information.'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = () => {
        setIsLogin(!isLogin);
        setError('');
        setEmail('');
        setUsername('');
        setPassword('');
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                {/* Header */}
                <div className="auth-header">
                    <div className="auth-logo">☁️</div>
                    <h2 className="auth-title">
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p className="auth-subtitle">
                        {isLogin ? 'Sign in to continue to Picasso' : 'Join Picasso today'}
                    </p>
                </div>

                {/* Tab Toggle */}
                <div className="auth-tab-toggle">
                    <button
                        type="button"
                        onClick={() => setIsLogin(true)}
                        className={`auth-tab-button ${isLogin ? 'active' : ''}`}
                    >
                        <LogIn size={16} />
                        Log In
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsLogin(false)}
                        className={`auth-tab-button ${!isLogin ? 'active' : ''}`}
                    >
                        <UserPlus size={16} />
                        Sign Up
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="auth-error">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Login Form */}
                {isLogin && (
                    <form onSubmit={handleLoginSubmit} className="auth-form">
                        <div className="auth-form-group">
                            <label className="auth-form-label">Username or Email</label>
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="auth-form-input"
                                placeholder="Enter your username or email"
                            />
                        </div>
                        <div className="auth-form-group">
                            <label className="auth-form-label">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="auth-form-input"
                                placeholder="Enter your password"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="auth-submit-button login"
                        >
                            <LogIn size={20} />
                            {loading ? 'Logging in...' : 'Log In'}
                        </button>
                    </form>
                )}

                {/* Signup Form */}
                {!isLogin && (
                    <form onSubmit={handleRegisterSubmit} className="auth-form">
                        <div className="auth-form-group">
                            <label className="auth-form-label">Email Address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="auth-form-input"
                                placeholder="Enter your email"
                            />
                        </div>
                        <div className="auth-form-group">
                            <label className="auth-form-label">Username</label>
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="auth-form-input"
                                placeholder="Choose a username"
                            />
                        </div>
                        <div className="auth-form-group">
                            <label className="auth-form-label">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="auth-form-input"
                                placeholder="Create a password"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="auth-submit-button signup"
                        >
                            <UserPlus size={20} />
                            {loading ? 'Creating...' : 'Sign Up'}
                        </button>
                    </form>
                )}

                {/* Footer Message */}
                <div className="auth-footer">
                    {isLogin ? (
                        <>
                            Don't have an account?
                            <button
                                type="button"
                                onClick={handleToggle}
                                className="auth-footer-link"
                            >
                                Sign up
                            </button>
                        </>
                    ) : (
                        <>
                            Already have an account?
                            <button
                                type="button"
                                onClick={handleToggle}
                                className="auth-footer-link signup"
                            >
                                Log in
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
