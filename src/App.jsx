import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './components/Login';
import Overview from './pages/Overview';
import Doctors from './pages/Doctors';
import Departments from './pages/Departments';
import Appointments from './pages/Appointments';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('respira_admin_auth') === 'true');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogin = () => { setIsAuthenticated(true); localStorage.setItem('respira_admin_auth', 'true'); };
  const handleLogout = () => { setIsAuthenticated(false); localStorage.removeItem('respira_admin_auth'); };

  if (!isAuthenticated) return <Login onLogin={handleLogin} />;

  return (
    <div className="flex h-screen bg-[var(--color-brand-surface)] text-slate-900 overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/doctors" element={<Doctors />} />
            <Route path="/departments" element={<Departments />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
export default App;