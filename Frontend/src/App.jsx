import React, { useState, useEffect } from 'react';
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
import NewsVerification from './pages/NewsVerification';
import LokSahayak from './pages/LokSahayak';

const Navigation = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[200] flex items-center justify-between px-6 md:px-14 h-16 transition-all duration-400 ${scrolled ? 'bg-white/85 backdrop-blur-xl border-b border-black/5 shadow-sm' : 'bg-transparent'}`}>
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-3 no-underline">
          <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-gradient-to-br from-[#FF6B35] via-[#E85D3A] to-[#138808] text-white font-serif font-bold text-sm shadow-md">
            भा
          </div>
          <span className="font-serif text-base font-semibold text-[#1B1B1F] tracking-tight">Sankalp Portal</span>
        </Link>
      </div>

      <div className="hidden lg:flex items-center gap-8">
        <ul className="flex gap-8 list-none p-0 m-0">
          <li><Link to="/" className="text-[13px] font-medium tracking-wider text-[#6B6B73] hover:text-[#1B1B1F] transition-colors uppercase no-underline relative group py-1">Home<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF6B35] scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span></Link></li>
          <li><Link to="/public-feed" className="text-[13px] font-medium tracking-wider text-[#6B6B73] hover:text-[#1B1B1F] transition-colors uppercase no-underline relative group py-1">Feed<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF6B35] scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span></Link></li>
          <li><Link to="/loksahayak" className="text-[13px] font-bold tracking-wider text-[#FF6B35] hover:opacity-80 transition-opacity uppercase no-underline flex items-center gap-1">LokSahayak</Link></li>
          <li><Link to="/news-verification" className="text-[13px] font-bold tracking-wider text-[#138808] hover:opacity-80 transition-opacity uppercase no-underline flex items-center gap-1">Verify</Link></li>
          
          {isAuthenticated && (
            <>
              {user?.role === 'user' && (
                <li><Link to="/citizen" className="text-[13px] font-medium tracking-wider text-[#6B6B73] hover:text-[#1B1B1F] transition-colors uppercase no-underline relative group py-1">Citizen<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF6B35] scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span></Link></li>
              )}
              {user?.role === 'ward_staff' && (
                <li><Link to="/ward-officer" className="text-[13px] font-medium tracking-wider text-[#6B6B73] hover:text-[#1B1B1F] transition-colors uppercase no-underline relative group py-1">Officer<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF6B35] scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span></Link></li>
              )}
              {user?.role === 'admin' && (
                <li><Link to="/admin" className="text-[13px] font-medium tracking-wider text-[#6B6B73] hover:text-[#1B1B1F] transition-colors uppercase no-underline relative group py-1">Admin<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF6B35] scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span></Link></li>
              )}
            </>
          )}
        </ul>

        {isAuthenticated ? (
          <button onClick={handleLogout} className="text-[12px] font-semibold tracking-wider text-red-500 hover:bg-red-50 px-4 py-2 rounded-full transition-all uppercase">Logout</button>
        ) : (
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-[13px] font-bold text-[#1B1B1F] hover:opacity-70 transition-opacity uppercase no-underline">Sign In</Link>
            <Link to="/signup" className="bg-[#1B1B1F] text-white text-[12px] font-bold px-6 py-2 rounded-full hover:bg-[#FF6B35] transition-all shadow-md uppercase no-underline">Join Now</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-[#FAFAF8] flex flex-col font-sans">
          <Navigation />

          <main className="flex-1 w-full flex flex-col pt-16">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/public-feed" element={<PublicFeed />} />
              <Route path="/loksahayak" element={<LokSahayak />} />
              <Route path="/news-verification" element={<NewsVerification />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

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

          <footer className="bg-[#1B1B1F] text-white px-6 md:px-14 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <div className="font-serif text-base font-semibold text-white tracking-wide">Sankalp Civic Portal</div>
              <div className="text-[12px] text-white/40 mt-1 tracking-wider uppercase">Ministry of Electronics & IT · Digital India Initiative</div>
            </div>
            <div className="font-serif text-base italic text-[#C8A84B] tracking-widest">सत्यमेव जयते</div>
            <div className="text-[11px] text-white/30 uppercase tracking-widest">© 2024 Sankalp. All rights reserved.</div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
