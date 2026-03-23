import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const Login = () => {
    const [role, setRole] = useState('user'); // 'user', 'ward', 'admin'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const endpoint = `/auth/${role}/login`;
            const payload = role === 'user' ? { email, password } : { gov_email: email, password };
            
            const response = await api.post(endpoint, payload);
            
            // Save token and user info
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('role', role);
            localStorage.setItem('user', JSON.stringify(response.data[role] || response.data.staff || response.data.admin));

            // Redirect based on role
            if (role === 'user') navigate('/citizen');
            else if (role === 'ward') navigate('/ward-officer');
            else if (role === 'admin') navigate('/admin');

        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-900/50 backdrop-blur-sm border border-white/10 p-8 rounded-2xl shadow-xl">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
                    <p className="text-slate-400">Login to your account to continue</p>
                </div>

                {/* Role Tabs */}
                <div className="flex bg-slate-950 p-1 rounded-xl mb-6">
                    <button 
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${role === 'user' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        onClick={() => setRole('user')}
                    >Citizen</button>
                    <button 
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${role === 'ward' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        onClick={() => setRole('ward')}
                    >Ward Staff</button>
                    <button 
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${role === 'admin' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        onClick={() => setRole('admin')}
                    >Admin</button>
                </div>

                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-sm mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                            {role === 'user' ? 'Email Address' : 'Gov Email Address (.gov.in)'}
                        </label>
                        <input
                            type="email"
                            required
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                            placeholder={role === 'user' ? 'you@example.com' : 'officer@city.gov.in'}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-indigo-500/20 mt-2 disabled:opacity-50"
                    >
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-500">
                    <p>Demo Credentials:</p>
                    <p className="mt-1">Admin: <span className="text-slate-300">admin@city.gov.in</span> / <span className="text-slate-300">password</span></p>
                    <p>Staff: <span className="text-slate-300">staff@ward1.gov.in</span> / <span className="text-slate-300">password</span></p>
                    <p>User: <span className="text-slate-300">user@example.com</span> / <span className="text-slate-300">password</span></p>
                </div>
            </div>
        </div>
    );
};

export default Login;
