import React, { useState, useEffect } from 'react';
import { Plus, Stethoscope, Trash2, Edit3, Loader2, ExternalLink, Activity } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { fetchSpecialties } from '../api';

const Specialties = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    sublabel: '',
    accent_color: '#0ea5e9',
    light_color: '#f0f9ff',
    conditionsText: '' // Comma-separated list for easy input
  });

  const loadSpecialtiesData = async () => {
    try {
      setLoading(true);
      const apiSpecialties = await fetchSpecialties();
      
      const localSpecs = JSON.parse(localStorage.getItem('respira_specialties_local')) || [];
      const deletedIds = JSON.parse(localStorage.getItem('respira_specialties_deleted')) || [];
      const updatedSpecs = JSON.parse(localStorage.getItem('respira_specialties_updated')) || {};

      const filteredApi = apiSpecialties
        .filter(s => !deletedIds.includes(s.id))
        .map(s => updatedSpecs[s.id] ? { ...s, ...updatedSpecs[s.id] } : s);

      setSpecialties([...filteredApi, ...localSpecs]);
      setError(null);
    } catch (err) {
      console.error("Error loading specialties:", err);
      setError("Failed to sync specialties from API. Showing offline cached records.");
      setSpecialties(JSON.parse(localStorage.getItem('respira_specialties_local')) || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSpecialtiesData();
  }, []);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({ name: '', sublabel: '', accent_color: '#0ea5e9', light_color: '#f0f9ff', conditionsText: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (spec) => {
    setEditingItem(spec);
    const condText = (spec.conditions || []).map(c => c.name).join(', ');
    setFormData({
      name: spec.name || '',
      sublabel: spec.sublabel || '',
      accent_color: spec.accent_color || '#0ea5e9',
      light_color: spec.light_color || '#f0f9ff',
      conditionsText: condText
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (spec) => {
    setItemToDelete(spec);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    const spec = itemToDelete;
    const isLocal = typeof spec.id === 'string' || spec.id > 1000000;
    
    if (isLocal) {
      const localSpecs = JSON.parse(localStorage.getItem('respira_specialties_local')) || [];
      const filtered = localSpecs.filter(s => s.id !== spec.id);
      localStorage.setItem('respira_specialties_local', JSON.stringify(filtered));
    } else {
      const deletedIds = JSON.parse(localStorage.getItem('respira_specialties_deleted')) || [];
      if (!deletedIds.includes(spec.id)) {
        deletedIds.push(spec.id);
        localStorage.setItem('respira_specialties_deleted', JSON.stringify(deletedIds));
      }
    }
    setSpecialties(specialties.filter(s => s.id !== spec.id));
    setItemToDelete(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Parse conditions
    const parsedConditions = formData.conditionsText
      .split(',')
      .map(c => c.trim())
      .filter(c => c.length > 0)
      .map((c, index) => ({
        id: Date.now() + index,
        name: c,
        is_active: true,
        display_order: index
      }));

    if (editingItem) {
      const isLocal = typeof editingItem.id === 'string' || editingItem.id > 1000000;
      const updatedItem = { 
        ...editingItem, 
        name: formData.name,
        sublabel: formData.sublabel,
        accent_color: formData.accent_color,
        light_color: formData.light_color,
        conditions: parsedConditions 
      };
      
      if (isLocal) {
        const localSpecs = JSON.parse(localStorage.getItem('respira_specialties_local')) || [];
        const updated = localSpecs.map(s => s.id === editingItem.id ? updatedItem : s);
        localStorage.setItem('respira_specialties_local', JSON.stringify(updated));
      } else {
        const updatedSpecs = JSON.parse(localStorage.getItem('respira_specialties_updated')) || {};
        updatedSpecs[editingItem.id] = {
          name: formData.name,
          sublabel: formData.sublabel,
          accent_color: formData.accent_color,
          light_color: formData.light_color,
          conditions: parsedConditions
        };
        localStorage.setItem('respira_specialties_updated', JSON.stringify(updatedSpecs));
      }
      
      setSpecialties(specialties.map(s => s.id === editingItem.id ? updatedItem : s));
    } else {
      const newSpec = {
        id: Date.now(),
        name: formData.name,
        slug: formData.name.toLowerCase().replace(/\s+/g, '-'),
        sublabel: formData.sublabel,
        accent_color: formData.accent_color,
        light_color: formData.light_color,
        is_active: true,
        conditions: parsedConditions
      };
      const localSpecs = JSON.parse(localStorage.getItem('respira_specialties_local')) || [];
      localStorage.setItem('respira_specialties_local', JSON.stringify([newSpec, ...localSpecs]));
      setSpecialties([newSpec, ...specialties]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Specialties</h1>
          <p className="text-slate-500 text-sm">Managing clinical departments and treatable conditions</p>
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
            <Plus size={20} /> Add Specialty
          </button>
        </div>
      </div>

      <div className="mb-6 bg-cyan-50/50 border border-cyan-100 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-cyan-800 text-sm leading-relaxed">
          <b>Admin Note:</b> Specialties are fetched from the live database. Modifying or deleting them updates your local session. For permanent data updates, please use the <b>Django Admin</b> page.
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
          <span className="font-semibold text-sm">Loading specialties from API...</span>
        </div>
      ) : (
        <>
          {specialties.length === 0 ? (
            <div className="text-center py-20 bg-white border border-slate-100 rounded-[32px] text-slate-400">
              <Stethoscope size={48} className="mx-auto mb-4 opacity-50" />
              <p className="font-bold text-lg">No specialties found</p>
              <p className="text-sm">Click "Add Specialty" to create a new category locally.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {specialties.map(spec => {
                const accent = spec.accent_color || '#0ea5e9';
                const lightBg = spec.light_color || '#f0f9ff';
                return (
                  <div 
                    key={spec.id} 
                    className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow relative group"
                    style={{ borderTop: `6px solid ${accent}` }}
                  >
                    <div className="p-8">
                      <div className="flex justify-between items-start mb-6">
                        <div 
                          className="w-14 h-14 rounded-2xl flex items-center justify-center"
                          style={{ backgroundColor: lightBg, color: accent }}
                        >
                          <Stethoscope size={28} />
                        </div>
                        <div className="flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleOpenEdit(spec)} className="p-2 text-slate-400 hover:text-slate-700"><Edit3 size={18} /></button>
                          <button onClick={() => handleDeleteClick(spec)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={18} /></button>
                        </div>
                      </div>

                      <h3 className="text-2xl font-bold text-slate-900 mb-1">{spec.name}</h3>
                      <p className="text-sm font-medium text-slate-400 mb-6">{spec.sublabel}</p>

                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                          <Activity size={12} /> Treatable Conditions ({spec.conditions?.length || 0})
                        </h4>
                        <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto pr-2">
                          {spec.conditions && spec.conditions.length > 0 ? (
                            spec.conditions.map(cond => (
                              <span 
                                key={cond.id} 
                                className="text-xs px-3 py-1.5 rounded-xl border font-medium text-slate-600 bg-slate-50 border-slate-100 transition-colors hover:bg-white"
                              >
                                {cond.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">No conditions specified</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
                      <span>Slug: <b>{spec.slug || 'N/A'}</b></span>
                      {typeof spec.id === 'number' && spec.id <= 1000 ? (
                        <span className="font-bold text-emerald-600">Live API</span>
                      ) : (
                        <span className="font-bold text-cyan-600">Local Cache</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Edit Specialty" : "Add Specialty"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Specialty Name</label>
            <input required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:border-[var(--color-brand-primary)]" placeholder="e.g. Neurological Physiotherapy" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Sublabel Description</label>
            <input required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:border-[var(--color-brand-primary)]" placeholder="e.g. Stroke, Spinal Cord, Parkinson's & more" value={formData.sublabel} onChange={(e) => setFormData({...formData, sublabel: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Accent Color (HEX)</label>
              <div className="flex gap-2 items-center">
                <input type="color" className="w-10 h-10 border-0 rounded-xl cursor-pointer" value={formData.accent_color} onChange={(e) => setFormData({...formData, accent_color: e.target.value})} />
                <input required className="flex-1 bg-slate-50 border border-slate-200 p-2 rounded-xl text-sm outline-none" placeholder="#7c3aed" value={formData.accent_color} onChange={(e) => setFormData({...formData, accent_color: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Light Background Color (HEX)</label>
              <div className="flex gap-2 items-center">
                <input type="color" className="w-10 h-10 border-0 rounded-xl cursor-pointer" value={formData.light_color} onChange={(e) => setFormData({...formData, light_color: e.target.value})} />
                <input required className="flex-1 bg-slate-50 border border-slate-200 p-2 rounded-xl text-sm outline-none" placeholder="#f5f3ff" value={formData.light_color} onChange={(e) => setFormData({...formData, light_color: e.target.value})} />
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Treatable Conditions (Comma Separated)</label>
            <textarea className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:border-[var(--color-brand-primary)] h-24 resize-none" placeholder="Stroke rehab, Bell's palsy, Balance disorder..." value={formData.conditionsText} onChange={(e) => setFormData({...formData, conditionsText: e.target.value})} />
          </div>
          <button type="submit" className="w-full py-4 bg-[var(--color-brand-dark)] text-white rounded-2xl font-bold shadow-lg hover:opacity-95 transition-opacity">
            {editingItem ? "Save Changes" : "Create Specialty"}
          </button>
        </form>
      </Modal>

      <ConfirmModal 
        isOpen={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        onConfirm={handleConfirmDelete} 
        title="Delete Specialty" 
        message={`Are you sure you want to remove the specialty: ${itemToDelete?.name}? This will remove all associated conditions locally.`} 
      />
    </div>
  );
};

export default Specialties;
