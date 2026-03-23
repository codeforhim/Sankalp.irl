import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';

const Register = () => {
    const [role, setRole] = useState('user'); // 'user', 'ward', 'admin'
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        city_id: '',
        ward_id: '',
        civic_body_id: ''
    });
    const [meta, setMeta] = useState({ cities: [], wards: [], civic_bodies: [] });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch cities, wards, civic bodies for dropdowns
        const fetchMeta = async () => {
            try {
                const response = await api.get('/public/meta');
                setMeta(response.data);
            } catch (err) {
                console.error("Failed to load metadata", err);
            }
        };
        fetchMeta();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const endpoint = `/auth/${role}/register`;
            
            // Build payload based on role
            let payload = { password: formData.password };
            if (role === 'user') {
                payload.email = formData.email;
            } else if (role === 'admin') {
                payload.gov_email = formData.email;
                payload.city_id = formData.city_id;
            } else if (role === 'ward') {
                payload.gov_email = formData.email;
                payload.city_id = formData.city_id;
                payload.ward_id = formData.ward_id;
                payload.civic_body_id = formData.civic_body_id;
            }
            
            const response = await api.post(endpoint, payload);
            
            // Save token and navigate
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('role', role);
            localStorage.setItem('user', JSON.stringify(response.data[role] || response.data.staff || response.data.admin));

            if (role === 'user') navigate('/citizen');
            else if (role === 'ward') navigate('/ward-officer');
            else if (role === 'admin') navigate('/admin');

        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Filter wards based on selected city
    const availableWards = meta.wards.filter(w => w.city_id === parseInt(formData.city_id));

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4 py-12">
            <div className="max-w-md w-full bg-slate-900/50 backdrop-blur-sm border border-white/10 p-8 rounded-2xl shadow-xl">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">Create Account</h1>
                    <p className="text-slate-400">Join the Civic Grievance Platform</p>
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

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                            {role === 'user' ? 'Email Address' : 'Gov Email Address (.gov.in)'}
                        </label>
                        <input
                            type="email"
                            name="email"
                            required
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                            placeholder={role === 'user' ? 'you@example.com' : 'officer@city.gov.in'}
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                        <input
                            type="password"
                            name="password"
                            required
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>

                    {(role === 'admin' || role === 'ward') && (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">City</label>
                            <select 
                                name="city_id" 
                                required 
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition"
                                value={formData.city_id}
                                onChange={handleChange}
                            >
                                <option value="">Select City</option>
                                {meta.cities.map(city => (
                                    <option key={city.id} value={city.id}>{city.city_name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {role === 'ward' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Ward</label>
                                <select 
                                    name="ward_id" 
                                    required 
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition disabled:opacity-50"
                                    value={formData.ward_id}
                                    onChange={handleChange}
                                    disabled={!formData.city_id}
                                >
                                    <option value="">Select Ward</option>
                                    {availableWards.map(ward => (
                                        <option key={ward.id} value={ward.id}>Ward {ward.ward_number} - {ward.ward_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Civic Department</label>
                                <select 
                                    name="civic_body_id" 
                                    required 
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition"
                                    value={formData.civic_body_id}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Department</option>
                                    {meta.civic_bodies.map(body => (
                                        <option key={body.id} value={body.id}>{body.name}</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}
                    
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-indigo-500/20 mt-4 disabled:opacity-50"
                    >
                        {loading ? 'Creating Account...' : 'Register'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-500">
                    <p>Already have an account? <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign In</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Register;
