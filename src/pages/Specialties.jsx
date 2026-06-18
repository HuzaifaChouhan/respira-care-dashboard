import React, { useState, useEffect } from 'react';
import { Plus, Stethoscope, Trash2, Edit3, Loader2, ExternalLink, Activity, X } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { fetchSpecialties, createSpecialty, updateSpecialty, deleteSpecialty, createCondition, deleteCondition } from '../api';

const Specialties = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // State for new condition inputs keyed by specialty ID
  const [newConditions, setNewConditions] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    sublabel: '',
    accent_color: '#0ea5e9',
    light_color: '#f0f9ff'
  });

  const loadSpecialtiesData = async () => {
    try {
      setLoading(true);
      const data = await fetchSpecialties();
      setSpecialties(data);
      setError(null);
    } catch (err) {
      console.error("Error loading specialties:", err);
      setError("Failed to sync specialties from API. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSpecialtiesData();
  }, []);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({ name: '', sublabel: '', accent_color: '#0ea5e9', light_color: '#f0f9ff' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (spec) => {
    setEditingItem(spec);
    setFormData({
      name: spec.name || '',
      sublabel: spec.sublabel || '',
      accent_color: spec.accent_color || '#0ea5e9',
      light_color: spec.light_color || '#f0f9ff'
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (spec) => {
    setItemToDelete(spec);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setLoading(true);
      await deleteSpecialty(itemToDelete.id);
      setSpecialties(specialties.filter(s => s.id !== itemToDelete.id));
      setItemToDelete(null);
      setError(null);
    } catch (err) {
      console.error("Failed to delete specialty:", err);
      setError("Failed to delete specialty from live database.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      name: formData.name,
      slug: formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      sublabel: formData.sublabel,
      accent_color: formData.accent_color,
      light_color: formData.light_color,
      is_active: true
    };

    try {
      if (editingItem) {
        await updateSpecialty(editingItem.id, payload);
      } else {
        await createSpecialty(payload);
      }
      
      const updatedSpecs = await fetchSpecialties();
      setSpecialties(updatedSpecs);
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to save specialty:", err);
      let errMsg = "Failed to save changes.";
      if (err.details) {
        errMsg = Object.entries(err.details)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`)
          .join('\n');
      }
      setError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle adding a condition in real-time
  const handleAddCondition = async (e, specialtyId) => {
    e.preventDefault();
    const condName = newConditions[specialtyId]?.trim();
    if (!condName) return;

    try {
      setError(null);
      await createCondition({
        specialty: specialtyId,
        name: condName,
        is_active: true
      });
      // Clear input
      setNewConditions({ ...newConditions, [specialtyId]: '' });
      // Reload list to show new condition
      const updatedSpecs = await fetchSpecialties();
      setSpecialties(updatedSpecs);
    } catch (err) {
      console.error("Failed to create condition:", err);
      setError("Failed to create condition. Make sure it doesn't already exist.");
    }
  };

  // Handle deleting a condition in real-time
  const handleDeleteCondition = async (conditionId) => {
    if (window.confirm("Permanently delete this treatment condition?")) {
      try {
        setError(null);
        await deleteCondition(conditionId);
        // Reload list to update UI
        const updatedSpecs = await fetchSpecialties();
        setSpecialties(updatedSpecs);
      } catch (err) {
        console.error("Failed to delete condition:", err);
        setError("Failed to delete condition.");
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Specialties</h1>
          <p className="text-slate-500 text-sm">Managing clinical departments and treatable conditions</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={handleOpenAdd} 
            disabled={loading}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-[var(--color-brand-dark)] text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-all disabled:opacity-50"
          >
            <Plus size={20} /> Add Specialty
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-100 text-amber-800 rounded-2xl text-sm font-medium whitespace-pre-wrap">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <Loader2 size={40} className="animate-spin text-[var(--color-brand-dark)]" />
          <span className="font-semibold text-sm">Syncing specialties from database...</span>
        </div>
      ) : (
        <>
          {specialties.length === 0 ? (
            <div className="text-center py-20 bg-white border border-slate-100 rounded-[32px] text-slate-400">
              <Stethoscope size={48} className="mx-auto mb-4 opacity-50" />
              <p className="font-bold text-lg">No specialties found</p>
              <p className="text-sm">Click "Add Specialty" to create a new category.</p>
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
                          <Activity size={12} /> Conditions ({spec.conditions?.length || 0})
                        </h4>
                        
                        {/* Scrollable list of conditions */}
                        <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto pr-2 mb-4">
                          {spec.conditions && spec.conditions.length > 0 ? (
                            spec.conditions.map(cond => (
                              <span 
                                key={cond.id} 
                                className="text-xs pl-3 pr-2 py-1.5 rounded-xl border font-medium text-slate-600 bg-slate-50 border-slate-100 flex items-center gap-1 group/cond hover:bg-slate-100 transition-colors"
                              >
                                {cond.name}
                                <button 
                                  type="button" 
                                  onClick={() => handleDeleteCondition(cond.id)}
                                  className="text-slate-400 hover:text-red-500 font-bold ml-1 text-sm focus:outline-none transition-colors"
                                  title="Delete condition"
                                >
                                  <X size={12} />
                                </button>
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic py-1">No conditions specified</span>
                          )}
                        </div>

                        {/* Inline Form to add a condition */}
                        <form onSubmit={(e) => handleAddCondition(e, spec.id)} className="flex gap-2">
                          <input 
                            required 
                            placeholder="Add treatment condition..." 
                            className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs outline-none focus:border-slate-200 transition-all text-slate-700"
                            value={newConditions[spec.id] || ''} 
                            onChange={(e) => setNewConditions({ ...newConditions, [spec.id]: e.target.value })} 
                          />
                          <button 
                            type="submit" 
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                          >
                            Add
                          </button>
                        </form>

                      </div>
                    </div>

                    <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
                      <span>Slug: <b>{spec.slug || 'N/A'}</b></span>
                      <span className="font-bold text-emerald-600">Live Sync</span>
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
            <input required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:border-[var(--color-brand-primary)] text-sm" placeholder="e.g. Neurological Physiotherapy" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Sublabel Description</label>
            <input required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:border-[var(--color-brand-primary)] text-sm" placeholder="e.g. Stroke, Spinal Cord, Parkinson's & more" value={formData.sublabel} onChange={(e) => setFormData({...formData, sublabel: e.target.value})} />
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
          <button 
            type="submit" 
            disabled={submitting}
            className="w-full py-4 bg-[var(--color-brand-dark)] text-white rounded-2xl font-bold shadow-lg hover:opacity-95 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Saving Live...
              </>
            ) : (
              editingItem ? "Save Changes" : "Create Specialty"
            )}
          </button>
        </form>
      </Modal>

      <ConfirmModal 
        isOpen={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        onConfirm={handleConfirmDelete} 
        title="Delete Specialty" 
        message={`Are you sure you want to permanently delete the specialty: ${itemToDelete?.name}? This immediately deletes the specialty and all associated conditions from the database.`} 
      />
    </div>
  );
};

export default Specialties;
