import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, User, Clock, Calendar } from 'lucide-react';
import Modal from '../components/Modal';

const Appointments = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [appointments, setAppointments] = useState(() => JSON.parse(localStorage.getItem('respira_appts')) || []);
  const [formData, setFormData] = useState({ patient: '', doctor: '', date: '', time: '' });

  useEffect(() => localStorage.setItem('respira_appts', JSON.stringify(appointments)), [appointments]);

  const handleOpenAdd = () => { setEditingItem(null); setFormData({ patient: '', doctor: '', date: '', time: '' }); setIsModalOpen(true); };
  const handleOpenEdit = (appt) => { setEditingItem(appt); setFormData(appt); setIsModalOpen(true); };
  const handleDelete = (id) => { if(window.confirm("Delete appointment?")) setAppointments(appointments.filter(a => a.id !== id)); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingItem) setAppointments(appointments.map(a => a.id === editingItem.id ? { ...formData } : a));
    else setAppointments([{ ...formData, id: Date.now(), status: "Scheduled" }, ...appointments]);
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Appointments</h1>
          <p className="text-slate-500 text-sm">Managing patient scheduling</p>
        </div>
        <button onClick={handleOpenAdd} className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-[var(--color-brand-dark)] text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-all">
          <Plus size={20} /> New Appointment
        </button>
      </div>

      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <tbody className="divide-y divide-slate-50">
              {appointments.map(a => (
                <tr key={a.id} className="hover:bg-slate-50/50 group">
                  <td className="px-8 py-5">
                    <div className="font-bold text-slate-900">{a.patient}</div>
                    <div className="text-xs text-slate-400">with {a.doctor}</div>
                  </td>
                  <td className="px-6 py-5 text-sm font-medium text-slate-600">{a.date} at {a.time}</td>
                  <td className="px-6 py-5 text-right space-x-2">
                    <button onClick={() => handleOpenEdit(a)} className="p-2 text-slate-400 hover:text-slate-800 transition-all"><Edit3 size={18} /></button>
                    <button onClick={() => handleDelete(a.id)} className="p-2 text-slate-400 hover:text-red-500 transition-all"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Edit Appointment" : "New Appointment"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required className="w-full bg-slate-50 border p-4 rounded-2xl" placeholder="Patient Name" value={formData.patient} onChange={(e) => setFormData({...formData, patient: e.target.value})} />
          <input required className="w-full bg-slate-50 border p-4 rounded-2xl" placeholder="Doctor Name" value={formData.doctor} onChange={(e) => setFormData({...formData, doctor: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
            <input type="date" className="bg-slate-50 border p-4 rounded-2xl text-sm" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
            <input type="time" className="bg-slate-50 border p-4 rounded-2xl text-sm" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} />
          </div>
          <button type="submit" className="w-full py-4 bg-[var(--color-brand-dark)] text-white rounded-2xl font-bold shadow-lg">Save Appointment</button>
        </form>
      </Modal>
    </div>
  );
};
export default Appointments;