import { ArrowUpRight } from 'lucide-react';

const StatCard = ({ label, value, change, icon: Icon }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-cyan-50 text-[var(--color-brand-dark)] rounded-xl">
        <Icon size={24} />
      </div>
      <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg flex items-center gap-1">
        {change} <ArrowUpRight size={12} />
      </span>
    </div>
    <h3 className="text-slate-500 text-sm font-medium">{label}</h3>
    <p className="text-2xl font-bold text-slate-900">{value}</p>
  </div>
);

export default StatCard;