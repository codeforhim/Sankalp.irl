import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// Pages
import Home from './pages/Home';
import CitizenPortal from './pages/CitizenPortal';
import WardOfficerDashboard from './pages/WardOfficerDashboard';
import MunicipalAdminDashboard from './pages/MunicipalAdminDashboard';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
        {/* Navigation Bar */}
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
                  <Link to="/citizen" className="text-slate-300 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-lg text-sm font-medium transition-all">Citizen Portal</Link>
                  <Link to="/ward-officer" className="text-slate-300 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-lg text-sm font-medium transition-all">Ward Officer</Link>
                  <Link to="/admin" className="text-slate-300 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-lg text-sm font-medium transition-all">Admin</Link>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 w-full flex flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/citizen" element={<CitizenPortal />} />
            <Route path="/ward-officer" element={<WardOfficerDashboard />} />
            <Route path="/admin" element={<MunicipalAdminDashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
