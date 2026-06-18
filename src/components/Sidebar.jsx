import { NavLink } from 'react-router-dom';
import { LayoutDashboard, UserRound, Stethoscope, BriefcaseMedical, CalendarCheck, LogOut, Activity, X } from 'lucide-react';

const Sidebar = ({ isOpen, onClose, onLogout }) => {
  const navItems = [
    { icon: LayoutDashboard, label: 'Overview', path: '/' },
    { icon: UserRound, label: 'Doctors', path: '/doctors' },
    { icon: Stethoscope, label: 'Specialties', path: '/specialties' },
    { icon: BriefcaseMedical, label: 'Services', path: '/services' },
    { icon: CalendarCheck, label: 'Appointments', path: '/appointments' },
  ];

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] lg:hidden" onClick={onClose} />}
      <aside className={`fixed lg:static inset-y-0 left-0 z-[110] w-64 bg-white border-r border-slate-200 flex flex-col h-full transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-brand-primary)] to-[var(--color-brand-dark)] rounded-xl flex items-center justify-center text-white"><Activity size={22} /></div>
            <span className="font-bold text-lg text-slate-800">Respira Admin</span>
          </div>
          <button onClick={onClose} className="lg:hidden p-2"><X size={20} /></button>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path} onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${isActive ? 'bg-cyan-50 text-[var(--color-brand-dark)] font-bold' : 'text-slate-500 hover:bg-slate-50'}`}>
              <item.icon size={20} />
              <span className="text-[15px]">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-6 border-t border-slate-50">
          <button onClick={onLogout} className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-500 w-full rounded-xl transition-all font-medium"><LogOut size={20} /><span>Sign Out</span></button>
        </div>
      </aside>
    </>
  );
};
export default Sidebar;