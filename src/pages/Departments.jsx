import React, { useState, useEffect } from 'react';
import { Plus, Building2, Trash2, Edit3 } from 'lucide-react';
import Modal from '../components/Modal';

const Departments = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [departments, setDepartments] = useState(() => JSON.parse(localStorage.getItem('respira_depts')) || []);
  const [formData, setFormData] = useState({ name: '', head: '' });

  useEffect(() => localStorage.setItem('respira_depts', JSON.stringify(departments)), [departments]);

  const handleOpenAdd = () => { setEditingItem(null); setFormData({ name: '', head: '' }); setIsModalOpen(true); };
  const handleOpenEdit = (dept) => { setEditingItem(dept); setFormData(dept); setIsModalOpen(true); };
  const handleDelete = (id) => { if(window.confirm("Delete Department?")) setDepartments(departments.filter(d => d.id !== id)); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingItem) setDepartments(departments.map(d => d.id === editingItem.id ? { ...formData } : d));
    else setDepartments([{ ...formData, id: Date.now(), status: 'Active' }, ...departments]);
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Departments</h1>
          <p className="text-slate-500 text-sm">Managing hospital units</p>
        </div>
        <button onClick={handleOpenAdd} className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-[var(--color-brand-dark)] text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-all">
          <Plus size={20} /> Add Dept
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map(dept => (
          <div key={dept.id} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm group relative">
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 bg-cyan-50 text-[var(--color-brand-dark)] rounded-2xl flex items-center justify-center"><Building2 size={28} /></div>
              <div className="flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleOpenEdit(dept)} className="p-2 text-slate-400 hover:text-[var(--color-brand-dark)]"><Edit3 size={18} /></button>
                <button onClick={() => handleDelete(dept.id)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={18} /></button>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">{dept.name}</h3>
            <p className="text-sm text-slate-500 italic font-medium">Head: {dept.head}</p>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Edit Department" : "Add Department"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required className="w-full bg-slate-50 border p-4 rounded-2xl outline-none" placeholder="Dept Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
          <input required className="w-full bg-slate-50 border p-4 rounded-2xl outline-none" placeholder="Head of Dept" value={formData.head} onChange={(e) => setFormData({...formData, head: e.target.value})} />
          <button type="submit" className="w-full py-4 bg-[var(--color-brand-dark)] text-white rounded-2xl font-bold shadow-lg">Save Changes</button>
        </form>
      </Modal>
    </div>
  );
};
export default Departments;