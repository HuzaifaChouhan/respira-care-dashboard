import React, { useState, useEffect } from 'react';
import { Plus, BriefcaseMedical, Trash2, Edit3, Loader2, ExternalLink, Tag } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { fetchServices, fetchServiceDetail, createService, updateService, deleteService } from '../api';

const Services = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    short_description: '',
    full_content: '',
    keyword_1: '',
    keyword_2: '',
    keyword_3: '',
    display_order: '1'
  });

  const loadServicesData = async () => {
    try {
      setLoading(true);
      const apiServices = await fetchServices();
      setServices(apiServices);
      setError(null);
    } catch (err) {
      console.error("Error loading services:", err);
      setError("Failed to sync services from API. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServicesData();
  }, []);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      short_description: '',
      full_content: '',
      keyword_1: '',
      keyword_2: '',
      keyword_3: '',
      display_order: '1'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (service) => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch full content and keywords from details view (by slug)
      const detail = await fetchServiceDetail(service.slug);
      
      setEditingItem(detail);
      setFormData({
        title: detail.title || '',
        short_description: detail.short_description || '',
        full_content: detail.full_content || '',
        keyword_1: detail.keywords?.[0] || '',
        keyword_2: detail.keywords?.[1] || '',
        keyword_3: detail.keywords?.[2] || '',
        display_order: detail.display_order?.toString() || '1'
      });
      setIsModalOpen(true);
    } catch (err) {
      console.error("Failed to load service detail:", err);
      setError("Failed to retrieve service details from live API.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (service) => {
    setItemToDelete(service);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setLoading(true);
      await deleteService(itemToDelete.slug);
      setServices(services.filter(s => s.id !== itemToDelete.id));
      setItemToDelete(null);
      setError(null);
    } catch (err) {
      console.error("Failed to delete service:", err);
      setError("Failed to permanently delete service from the database.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      title: formData.title,
      slug: formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      short_description: formData.short_description,
      full_content: formData.full_content,
      keyword_1: formData.keyword_1,
      keyword_2: formData.keyword_2,
      keyword_3: formData.keyword_3,
      display_order: parseInt(formData.display_order) || 1,
      is_active: true
    };

    try {
      if (editingItem) {
        // Use editingItem slug as it was fetched from the backend
        await updateService(editingItem.slug, payload);
      } else {
        await createService(payload);
      }
      
      const updatedServices = await fetchServices();
      setServices(updatedServices);
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to save service:", err);
      let errMsg = "Failed to save changes to API database.";
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

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Services</h1>
          <p className="text-slate-500 text-sm">Managing core hospital services and offerings</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={handleOpenAdd} 
            disabled={loading}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-[var(--color-brand-dark)] text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-all disabled:opacity-50"
          >
            <Plus size={20} /> Add Service
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
          <span className="font-semibold text-sm">Syncing services from database...</span>
        </div>
      ) : (
        <>
          {services.length === 0 ? (
            <div className="text-center py-20 bg-white border border-slate-100 rounded-[32px] text-slate-400">
              <BriefcaseMedical size={48} className="mx-auto mb-4 opacity-50" />
              <p className="font-bold text-lg">No services found</p>
              <p className="text-sm">Click "Add Service" to create a new service offering.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map(service => (
                <div key={service.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm relative group flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center text-[var(--color-brand-dark)]">
                        <BriefcaseMedical size={24} />
                      </div>
                      <div className="flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenEdit(service)} className="p-2 text-slate-400 hover:text-[var(--color-brand-dark)]"><Edit3 size={18} /></button>
                        <button onClick={() => handleDeleteClick(service)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={18} /></button>
                      </div>
                    </div>
                    <h3 className="font-bold text-lg text-slate-900">{service.title}</h3>
                    
                    <p className="text-slate-500 text-sm mt-3 leading-relaxed">
                      {service.short_description || 'No description provided.'}
                    </p>

                    {service.keywords && service.keywords.length > 0 && (
                      <div className="mt-5">
                        <div className="flex flex-wrap gap-1.5">
                          {service.keywords.filter(Boolean).map((kw, i) => (
                            <span key={i} className="text-[10px] bg-slate-50 border border-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-md flex items-center gap-1 uppercase tracking-wider">
                              <Tag size={8} /> {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-50 mt-6 pt-4 flex justify-between items-center text-xs text-slate-400">
                    <span>Order: <b>{service.display_order}</b></span>
                    <span className="font-bold text-emerald-600">Live Sync</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Edit Service" : "Add Service"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Service Title</label>
            <input required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:border-[var(--color-brand-primary)] text-sm" placeholder="e.g. Sports Rehabilitation" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Short Description</label>
            <textarea required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:border-[var(--color-brand-primary)] h-16 resize-none text-sm" placeholder="Explain the service details..." value={formData.short_description} onChange={(e) => setFormData({...formData, short_description: e.target.value})} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Full Detail Content</label>
            <textarea required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:border-[var(--color-brand-primary)] h-24 resize-none text-sm" placeholder="Write full details about the service treatment..." value={formData.full_content} onChange={(e) => setFormData({...formData, full_content: e.target.value})} />
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Keyword 1</label>
              <input className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none text-xs" placeholder="e.g. Sports" value={formData.keyword_1} onChange={(e) => setFormData({...formData, keyword_1: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Keyword 2</label>
              <input className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none text-xs" placeholder="e.g. Recovery" value={formData.keyword_2} onChange={(e) => setFormData({...formData, keyword_2: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Keyword 3</label>
              <input className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none text-xs" placeholder="e.g. Rehab" value={formData.keyword_3} onChange={(e) => setFormData({...formData, keyword_3: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Display Order</label>
            <input type="number" required className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none text-sm" placeholder="e.g. 1" value={formData.display_order} onChange={(e) => setFormData({...formData, display_order: e.target.value})} />
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
              editingItem ? "Save Changes" : "Create Service"
            )}
          </button>
        </form>
      </Modal>

      <ConfirmModal 
        isOpen={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        onConfirm={handleConfirmDelete} 
        title="Delete Service" 
        message={`Are you sure you want to permanently delete the service: ${itemToDelete?.title}? This action immediately updates the central database.`} 
      />
    </div>
  );
};

export default Services;
