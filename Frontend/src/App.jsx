import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import CitizenPortal from './pages/CitizenPortal';
import WardOfficerDashboard from './pages/WardOfficerDashboard';
import MunicipalAdminDashboard from './pages/MunicipalAdminDashboard';
import PublicFeed from './pages/PublicFeed';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';

const Navigation = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-slate-900/80 backdrop-blur-md shadow-sm border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex space-x-8 items-center justify-between w-full">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold text-xl">L</div>
              <span className="text-xl font-black tracking-tight text-white">LokaYuktai</span>
            </Link>
            <div className="hidden md:flex items-center space-x-1">
              <Link to="/" className="text-slate-300 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-lg text-sm font-medium transition-all">Home</Link>
              <Link to="/public-feed" className="text-slate-300 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-lg text-sm font-medium transition-all">Public Feed</Link>
              {isAuthenticated ? (
                  <>
                    <Link to="/citizen" className="text-slate-300 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-lg text-sm font-medium transition-all">Citizen Portal</Link>
                    <Link to="/ward-officer" className="text-slate-300 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-lg text-sm font-medium transition-all">Ward Officer</Link>
                    <Link to="/admin" className="text-slate-300 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-lg text-sm font-medium transition-all">Admin</Link>
                    <button onClick={handleLogout} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-2 rounded-lg text-sm font-medium transition-all ml-4">Logout</button>
                  </>
              ) : (
                  <div className="flex items-center space-x-2 ml-4">
                    <Link to="/login" className="text-slate-300 hover:text-white px-4 py-2 rounded-xl text-sm font-bold transition-all">Sign In</Link>
                    <Link to="/signup" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/30">Sign Up</Link>
                  </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
          {/* Navigation Bar */}
          <Navigation />

          {/* Main Content Area */}
          <main className="flex-1 w-full flex flex-col">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/public-feed" element={<PublicFeed />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Protected Routes */}
              <Route path="/citizen" element={
                <ProtectedRoute allowedRoles={['user', 'ward_staff', 'admin']}>
                  <CitizenPortal />
                </ProtectedRoute>
              } />
              
              <Route path="/ward-officer" element={
                <ProtectedRoute allowedRoles={['ward_staff', 'admin']}>
                  <WardOfficerDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <MunicipalAdminDashboard />
                </ProtectedRoute>
              } />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
