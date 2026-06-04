import React, { useState } from 'react';
import { Activity, Lock, User, AlertCircle } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // --- SET YOUR SPECIFIC CREDENTIALS HERE ---
  const VALID_EMAIL = "admin@respiracare.com";
  const VALID_PASSWORD = "admin123";

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate API delay
    setTimeout(() => {
      if (email === VALID_EMAIL && password === VALID_PASSWORD) {
        onLogin(); // Success!
      } else {
        setError('Invalid admin credentials. Please try again.');
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xl px-4">
      <div className="bg-white w-full max-w-md p-8 sm:p-10 rounded-[32px] shadow-2xl border border-white/20">
        
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[var(--color-brand-primary)] to-[var(--color-brand-dark)] rounded-2xl flex items-center justify-center text-white shadow-lg mb-4">
            <Activity size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Portal</h1>
          <p className="text-slate-500 text-sm">Secure access for RespiraCare Admin</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm animate-shake">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 ml-1">Admin Email</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@respiracare.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 focus:ring-4 focus:ring-cyan-50 focus:border-[var(--color-brand-primary)] outline-none transition-all"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 focus:ring-4 focus:ring-cyan-50 focus:border-[var(--color-brand-primary)] outline-none transition-all"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-2 bg-gradient-to-r from-[var(--color-brand-primary)] to-[var(--color-brand-dark)] text-white rounded-2xl font-bold shadow-xl shadow-cyan-100 hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              'Sign In to Console'
            )}
          </button>
        </form>

        <p className="text-center text-slate-400 text-xs mt-8">
          Authorized personnel only. All access is logged.
        </p>
      </div>
    </div>
  );
};

export default Login;