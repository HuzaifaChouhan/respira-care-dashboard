import React, { useState, useEffect } from 'react';
import { Plus, UserRound, Trash2, Edit3, Search } from 'lucide-react';
import Modal from '../components/Modal';

const Doctors = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [doctors, setDoctors] = useState(() => JSON.parse(localStorage.getItem('respira_doctors')) || []);
  const [formData, setFormData] = useState({ name: '', specialty: '', email: '' });

  useEffect(() => localStorage.setItem('respira_doctors', JSON.stringify(doctors)), [doctors]);

  const handleOpenAdd = () => { setEditingItem(null); setFormData({ name: '', specialty: '', email: '' }); setIsModalOpen(true); };
  const handleOpenEdit = (doc) => { setEditingItem(doc); setFormData(doc); setIsModalOpen(true); };
  const handleDelete = (id) => { if(window.confirm("Delete doctor?")) setDoctors(doctors.filter(d => d.id !== id)); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingItem) setDoctors(doctors.map(d => d.id === editingItem.id ? { ...formData } : d));
    else setDoctors([{ ...formData, id: Date.now(), status: 'Available' }, ...doctors]);
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Doctors</h1>
          <p className="text-slate-500 text-sm">Managing specialist staff</p>
        </div>
        <button onClick={handleOpenAdd} className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-[var(--color-brand-dark)] text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-all">
          <Plus size={20} /> Add Doctor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors.map(doc => (
          <div key={doc.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm relative group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center text-[var(--color-brand-dark)]"><UserRound size={24} /></div>
              <div className="flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleOpenEdit(doc)} className="p-2 text-slate-400 hover:text-[var(--color-brand-dark)]"><Edit3 size={18} /></button>
                <button onClick={() => handleDelete(doc.id)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={18} /></button>
              </div>
            </div>
            <h3 className="font-bold text-lg text-slate-900">{doc.name}</h3>
            <p className="text-slate-400 text-sm font-medium">{doc.specialty}</p>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Edit Doctor" : "Add Doctor"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required className="w-full bg-slate-50 border p-4 rounded-2xl outline-none" placeholder="Doctor Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
          <input required className="w-full bg-slate-50 border p-4 rounded-2xl outline-none" placeholder="Specialty" value={formData.specialty} onChange={(e) => setFormData({...formData, specialty: e.target.value})} />
          <button type="submit" className="w-full py-4 bg-[var(--color-brand-dark)] text-white rounded-2xl font-bold shadow-lg">Save Changes</button>
        </form>
      </Modal>
    </div>
  );
};
export default Doctors;