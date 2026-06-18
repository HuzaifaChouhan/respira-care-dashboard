import React, { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import { UserRound, Stethoscope, BriefcaseMedical, CalendarCheck, LayoutDashboard, Loader2 } from 'lucide-react';
import { fetchDoctors, fetchSpecialties, fetchServices } from '../api';

const Overview = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    doctorsCount: 0,
    specialtiesCount: 0,
    servicesCount: 0,
    appointmentsCount: 0,
  });

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const [doctors, specialties, services] = await Promise.all([
          fetchDoctors(),
          fetchSpecialties(),
          fetchServices(),
        ]);
        
        // Load appointments from localStorage
        const localAppts = JSON.parse(localStorage.getItem('respira_appts')) || [];

        setStats({
          doctorsCount: doctors.length,
          specialtiesCount: specialties.length,
          servicesCount: services.length,
          appointmentsCount: localAppts.length,
        });
        setError(null);
      } catch (err) {
        console.error("Failed to load overview statistics:", err);
        setError("Could not load latest system stats.");
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  const statCards = [
    { label: 'Total Doctors', value: loading ? '...' : stats.doctorsCount, change: 'Live', icon: UserRound },
    { label: 'Specialties', value: loading ? '...' : stats.specialtiesCount, change: 'Live', icon: Stethoscope },
    { label: 'Services Offered', value: loading ? '...' : stats.servicesCount, change: 'Live', icon: BriefcaseMedical },
    { label: 'Appointments Scheduled', value: stats.appointmentsCount, change: 'Local', icon: CalendarCheck },
  ];

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
      <header className="mb-8 flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Overview</h1>
        <p className="text-slate-500 text-sm">Managing hospital infrastructure and schedules.</p>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium">
          {error} (Showing cached/simulated details where available)
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 mb-6 text-slate-400 text-sm">
          <Loader2 size={16} className="animate-spin" /> Fetching live API data...
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      <div className="bg-white p-12 rounded-[32px] border border-slate-100 flex flex-col items-center text-center shadow-sm">
        <div className="w-20 h-20 bg-cyan-50 text-[var(--color-brand-dark)] rounded-3xl flex items-center justify-center mb-6 shadow-inner animate-pulse">
          <LayoutDashboard size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">System Active</h2>
        <p className="text-slate-400 mt-2 max-w-md leading-relaxed">
          The management console is online. Access clinical resources, schedule patients, and audit medical specialties using the navigation panel.
        </p>
        
        <div className="mt-8 flex gap-3 flex-wrap justify-center">
            <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold uppercase tracking-wider">
                System Online
            </div>
            <div className="px-4 py-2 bg-slate-50 text-slate-400 rounded-full text-xs font-bold uppercase tracking-wider">
                v3.0.0
            </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;