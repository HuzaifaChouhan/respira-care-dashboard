import React from 'react';
import StatCard from '../components/StatCard';
// Added LayoutDashboard to the import list below
import { UserRound, Building2, CalendarCheck, LayoutDashboard } from 'lucide-react';

const Overview = () => {
  const stats = [
    { label: 'Total Doctors', value: '48', change: '+2', icon: UserRound },
    { label: 'Active Departments', value: '12', change: 'Stable', icon: Building2 },
    { label: 'Total Appointments', value: '432', change: '+18%', icon: CalendarCheck },
  ];

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
      <header className="mb-8 flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Overview</h1>
        <p className="text-slate-500 text-sm">Managing hospital infrastructure and schedules.</p>
      </header>

      {/* Grid with 3 columns since Patients was removed */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      <div className="bg-white p-12 rounded-[32px] border border-slate-100 flex flex-col items-center text-center shadow-sm">
        <div className="w-20 h-20 bg-cyan-50 text-[var(--color-brand-dark)] rounded-3xl flex items-center justify-center mb-6 shadow-inner">
          {/* This was the icon causing the error - it is now imported */}
          <LayoutDashboard size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Admin Console Active</h2>
        <p className="text-slate-400 mt-2 max-w-sm leading-relaxed">
          The RespiraCare management system is online. Use the sidebar to manage doctors, departmental resources, and upcoming appointment slots.
        </p>
        
        <div className="mt-8 flex gap-3">
            <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold uppercase tracking-wider">
                System Healthy
            </div>
            <div className="px-4 py-2 bg-slate-50 text-slate-400 rounded-full text-xs font-bold uppercase tracking-wider">
                v2.0.4
            </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;