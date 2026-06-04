import React from 'react';
import { Menu, Shield } from 'lucide-react';

const Header = ({ onMenuClick }) => {
  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20">
      
      {/* MOBILE MENU BUTTON (Only shows on mobile) */}
      <div className="flex items-center">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-all active:scale-95"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* RIGHT SIDE: ADMIN PROFILE */}
      <div className="flex items-center gap-4 ml-auto">
        
        {/* TEXT DETAILS (Hidden on very small screens) */}
        <div className="text-right hidden sm:block">
          <p className="text-sm font-extrabold text-slate-800 leading-none">System Admin</p>
          <p className="text-[10px] font-bold text-[var(--color-brand-dark)] uppercase tracking-widest mt-1">
            Root Access
          </p>
        </div>

        {/* PROFILE ICON */}
        <div className="h-11 w-11 rounded-2xl bg-slate-900 flex items-center justify-center text-white border-2 border-white ring-2 ring-slate-100 shadow-sm">
           <Shield size={22} />
        </div>
      </div>

    </header>
  );
};

export default Header;