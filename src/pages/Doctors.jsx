import React, { useState, useEffect } from 'react';
import { Plus, UserRound, Trash2, Edit3, Loader2, ExternalLink } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { fetchDoctors } from '../api';

const Doctors = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    specialty_name: '',
    qualification: '',
    experience_years: '',
    bio: ''
  });

  const loadDoctorsData = async () => {
    try {
      setLoading(true);
      const apiDoctors = await fetchDoctors();
      
      const localDoctors = JSON.parse(localStorage.getItem('respira_doctors_local')) || [];
      const deletedIds = JSON.parse(localStorage.getItem('respira_doctors_deleted')) || [];
      const updatedDocs = JSON.parse(localStorage.getItem('respira_doctors_updated')) || {};

      const filteredApi = apiDoctors
        .filter(d => !deletedIds.includes(d.id))
        .map(d => updatedDocs[d.id] ? { ...d, ...updatedDocs[d.id] } : d);

      setDoctors([...filteredApi, ...localDoctors]);
      setError(null);
    } catch (err) {
      console.error("Error fetching doctors:", err);
      setError("Failed to sync with live API. Displaying offline cached records.");
      setDoctors(JSON.parse(localStorage.getItem('respira_doctors_local')) || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctorsData();
  }, []);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({ name: '', specialty_name: '', qualification: '', experience_years: '', bio: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (doc) => {
    setEditingItem(doc);
    setFormData({
      name: doc.name || '',
      specialty_name: doc.specialty_name || '',
      qualification: doc.qualification || '',
      experience_years: doc.experience_years || '',
      bio: doc.bio || ''
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (doc) => {
    setItemToDelete(doc);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    const doc = itemToDelete;
    const isLocal = typeof doc.id === 'string' || doc.id > 1000000;
    
    if (isLocal) {
      const localDoctors = JSON.parse(localStorage.getItem('respira_doctors_local')) || [];
      const filtered = localDoctors.filter(d => d.id !== doc.id);
      localStorage.setItem('respira_doctors_local', JSON.stringify(filtered));
    } else {
      const deletedIds = JSON.parse(localStorage.getItem('respira_doctors_deleted')) || [];
      if (!deletedIds.includes(doc.id)) {
        deletedIds.push(doc.id);
        localStorage.setItem('respira_doctors_deleted', JSON.stringify(deletedIds));
      }
    }
    setDoctors(doctors.filter(d => d.id !== doc.id));
    setItemToDelete(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formattedExp = parseInt(formData.experience_years) || 0;
    
    if (editingItem) {
      const isLocal = typeof editingItem.id === 'string' || editingItem.id > 1000000;
      const updatedItem = { ...editingItem, ...formData, experience_years: formattedExp };
      
      if (isLocal) {
        const localDoctors = JSON.parse(localStorage.getItem('respira_doctors_local')) || [];
        const updated = localDoctors.map(d => d.id === editingItem.id ? updatedItem : d);
        localStorage.setItem('respira_doctors_local', JSON.stringify(updated));
      } else {
        const updatedDocs = JSON.parse(localStorage.getItem('respira_doctors_updated')) || {};
        updatedDocs[editingItem.id] = { ...formData, experience_years: formattedExp };
        localStorage.setItem('respira_doctors_updated', JSON.stringify(updatedDocs));
      }
      
      setDoctors(doctors.map(d => d.id === editingItem.id ? updatedItem : d));
    } else {
      const newDoc = {
        ...formData,
        experience_years: formattedExp,
        id: Date.now(),
        is_active: true
      };
      const localDoctors = JSON.parse(localStorage.getItem('respira_doctors_local')) || [];
      localStorage.setItem('respira_doctors_local', JSON.stringify([newDoc, ...localDoctors]));
      setDoctors([newDoc, ...doctors]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Doctors</h1>
          <p className="text-slate-500 text-sm">Managing specialist staff from live API</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <a 
            href="https://api.husnoorinfotech.in/admin/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-sm transition-all"
          >
            Django Admin <ExternalLink size={16} />
          </a>
          <button 
            onClick={handleOpenAdd} 
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-[var(--color-brand-dark)] text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-all"
          >
            <Plus size={20} /> Add Doctor
          </button>
        </div>
      </div>

      <div className="mb-6 bg-cyan-50/50 border border-cyan-100 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-cyan-800 text-sm leading-relaxed">
          <b>Admin Note:</b> Changes made below are saved in your local session. To permanently update the shared central database, click the <b>Django Admin</b> button.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-100 text-amber-800 rounded-2xl text-sm font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <Loader2 size={40} className="animate-spin text-[var(--color-brand-dark)]" />
          <span className="font-semibold text-sm">Syncing with Django database...</span>
        </div>
      ) : (
        <>
          {doctors.length === 0 ? (
            <div className="text-center py-20 bg-white border border-slate-100 rounded-[32px] text-slate-400">
              <UserRound size={48} className="mx-auto mb-4 opacity-50" />
              <p className="font-bold text-lg">No doctors found</p>
              <p className="text-sm">Click "Add Doctor" to create a new profile locally.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctors.map(doc => (
                <div key={doc.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm relative group flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center text-[var(--color-brand-dark)]">
                        <UserRound size={24} />
                      </div>
                      <div className="flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenEdit(doc)} className="p-2 text-slate-400 hover:text-[var(--color-brand-dark)]"><Edit3 size={18} /></button>
                        <button onClick={() => handleDeleteClick(doc)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={18} /></button>
                      </div>
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                      {doc.name}
                      {!doc.is_active && (
                        <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full uppercase">Inactive</span>
                      )}
                    </h3>
                    <p className="text-[var(--color-brand-dark)] text-sm font-semibold mt-1">{doc.specialty_name || 'General Practitioner'}</p>
                    
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {doc.qualification && (
                        <span className="text-xs bg-slate-50 border border-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-medium">
                          {doc.qualification}
                        </span>
                      )}
                      {doc.experience_years !== undefined && (
                        <span className="text-xs bg-cyan-50/50 text-cyan-800 px-2.5 py-1 rounded-lg font-semibold">
                          {doc.experience_years} Years Exp.
                        </span>
                      )}
                    </div>

                    {doc.bio && (
                      <p className="text-slate-400 text-sm mt-4 leading-relaxed line-clamp-3 italic">
                        "{doc.bio}"
                      </p>
                    )}
                  </div>

                  <div className="border-t border-slate-50 mt-6 pt-4 flex justify-between items-center text-xs text-slate-400">
                    <span>ID: #{doc.id}</span>
                    {typeof doc.id === 'number' && doc.id <= 100000 ? (
                      <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">API Live</span>
                    ) : (
                      <span className="text-cyan-600 font-bold bg-cyan-50 px-2 py-0.5 rounded-md">Local Override</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Edit Doctor Profile" : "Add Doctor Profile"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Doctor Name</label>
            <input required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:border-[var(--color-brand-primary)]" placeholder="Dr. John Doe" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Specialty Name</label>
            <input required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:border-[var(--color-brand-primary)]" placeholder="e.g. Neuro Physiotherapy" value={formData.specialty_name} onChange={(e) => setFormData({...formData, specialty_name: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Qualification</label>
              <input required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:border-[var(--color-brand-primary)]" placeholder="BPT, MPT" value={formData.qualification} onChange={(e) => setFormData({...formData, qualification: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Years of Experience</label>
              <input type="number" required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:border-[var(--color-brand-primary)]" placeholder="e.g. 5" value={formData.experience_years} onChange={(e) => setFormData({...formData, experience_years: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Professional Bio</label>
            <textarea className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:border-[var(--color-brand-primary)] h-24 resize-none" placeholder="Short description of the doctor's experience..." value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} />
          </div>
          <button type="submit" className="w-full py-4 bg-[var(--color-brand-dark)] text-white rounded-2xl font-bold shadow-lg hover:opacity-95 transition-opacity">
            {editingItem ? "Save Changes" : "Create Profile"}
          </button>
        </form>
      </Modal>

      <ConfirmModal 
        isOpen={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        onConfirm={handleConfirmDelete} 
        title="Delete Doctor Profile" 
        message={`Are you sure you want to remove ${itemToDelete?.name}? This action cannot be undone.`} 
      />
    </div>
  );
};

export default Doctors;