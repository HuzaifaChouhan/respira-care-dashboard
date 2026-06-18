import React, { useState, useEffect } from 'react';
import { Plus, BriefcaseMedical, Trash2, Edit3, Loader2, ExternalLink, HelpCircle, Tag } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { fetchServices } from '../api';

const Services = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    short_description: '',
    keywordsText: '', // Comma-separated list for easy input
    display_order: ''
  });

  const loadServicesData = async () => {
    try {
      setLoading(true);
      const apiServices = await fetchServices();
      
      const localServices = JSON.parse(localStorage.getItem('respira_services_local')) || [];
      const deletedIds = JSON.parse(localStorage.getItem('respira_services_deleted')) || [];
      const updatedServices = JSON.parse(localStorage.getItem('respira_services_updated')) || {};

      const filteredApi = apiServices
        .filter(s => !deletedIds.includes(s.id))
        .map(s => updatedServices[s.id] ? { ...s, ...updatedServices[s.id] } : s);

      setServices([...filteredApi, ...localServices]);
      setError(null);
    } catch (err) {
      console.error("Error loading services:", err);
      setError("Failed to sync services from API. Showing offline cached records.");
      setServices(JSON.parse(localStorage.getItem('respira_services_local')) || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServicesData();
  }, []);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({ title: '', short_description: '', keywordsText: '', display_order: '1' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (service) => {
    setEditingItem(service);
    const keywordsStr = (service.keywords || []).join(', ');
    setFormData({
      title: service.title || '',
      short_description: service.short_description || '',
      keywordsText: keywordsStr,
      display_order: service.display_order?.toString() || '1'
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (service) => {
    setItemToDelete(service);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    const service = itemToDelete;
    const isLocal = typeof service.id === 'string' || service.id > 1000000;
    
    if (isLocal) {
      const localServices = JSON.parse(localStorage.getItem('respira_services_local')) || [];
      const filtered = localServices.filter(s => s.id !== service.id);
      localStorage.setItem('respira_services_local', JSON.stringify(filtered));
    } else {
      const deletedIds = JSON.parse(localStorage.getItem('respira_services_deleted')) || [];
      if (!deletedIds.includes(service.id)) {
        deletedIds.push(service.id);
        localStorage.setItem('respira_services_deleted', JSON.stringify(deletedIds));
      }
    }
    setServices(services.filter(s => s.id !== service.id));
    setItemToDelete(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedKeywords = formData.keywordsText
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);
    const orderNum = parseInt(formData.display_order) || 1;

    if (editingItem) {
      const isLocal = typeof editingItem.id === 'string' || editingItem.id > 1000000;
      const updatedItem = { 
        ...editingItem, 
        title: formData.title,
        short_description: formData.short_description,
        keywords: parsedKeywords,
        display_order: orderNum
      };
      
      if (isLocal) {
        const localServices = JSON.parse(localStorage.getItem('respira_services_local')) || [];
        const updated = localServices.map(s => s.id === editingItem.id ? updatedItem : s);
        localStorage.setItem('respira_services_local', JSON.stringify(updated));
      } else {
        const updatedServices = JSON.parse(localStorage.getItem('respira_services_updated')) || {};
        updatedSpecs[editingItem.id] = {
          title: formData.title,
          short_description: formData.short_description,
          keywords: parsedKeywords,
          display_order: orderNum
        };
        localStorage.setItem('respira_services_updated', JSON.stringify(updatedServices));
      }
      
      setServices(services.map(s => s.id === editingItem.id ? updatedItem : s));
    } else {
      const newService = {
        id: Date.now(),
        title: formData.title,
        slug: formData.title.toLowerCase().replace(/\s+/g, '-'),
        short_description: formData.short_description,
        keywords: parsedKeywords,
        display_order: orderNum
      };
      const localServices = JSON.parse(localStorage.getItem('respira_services_local')) || [];
      localStorage.setItem('respira_services_local', JSON.stringify([newService, ...localServices]));
      setServices([newService, ...services]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Services</h1>
          <p className="text-slate-500 text-sm">Managing core hospital services and offerings</p>
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
            <Plus size={20} /> Add Service
          </button>
        </div>
      </div>

      <div className="mb-6 bg-cyan-50/50 border border-cyan-100 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-cyan-800 text-sm leading-relaxed">
          <b>Admin Note:</b> Services are synced from the live API database. Local edits and deletions are cached in your browser. Live adjustments must be completed via the <b>Django Admin</b>.
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
          <span className="font-semibold text-sm">Loading services from API...</span>
        </div>
      ) : (
        <>
          {services.length === 0 ? (
            <div className="text-center py-20 bg-white border border-slate-100 rounded-[32px] text-slate-400">
              <BriefcaseMedical size={48} className="mx-auto mb-4 opacity-50" />
              <p className="font-bold text-lg">No services found</p>
              <p className="text-sm">Click "Add Service" to create a new service offering locally.</p>
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
                          {service.keywords.map((kw, i) => (
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
                    {typeof service.id === 'number' && service.id <= 1000 ? (
                      <span className="font-bold text-emerald-600">Live API</span>
                    ) : (
                      <span className="font-bold text-cyan-600">Local Cache</span>
                    )}
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
            <input required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:border-[var(--color-brand-primary)]" placeholder="e.g. Sports Rehabilitation" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Short Description</label>
            <textarea required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:border-[var(--color-brand-primary)] h-24 resize-none" placeholder="Explain the service details..." value={formData.short_description} onChange={(e) => setFormData({...formData, short_description: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Keywords (Comma Separated)</label>
              <input required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:border-[var(--color-brand-primary)]" placeholder="e.g. Sports, Recovery" value={formData.keywordsText} onChange={(e) => setFormData({...formData, keywordsText: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Display Order</label>
              <input type="number" required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:border-[var(--color-brand-primary)]" placeholder="e.g. 1" value={formData.display_order} onChange={(e) => setFormData({...formData, display_order: e.target.value})} />
            </div>
          </div>
          <button type="submit" className="w-full py-4 bg-[var(--color-brand-dark)] text-white rounded-2xl font-bold shadow-lg hover:opacity-95 transition-opacity">
            {editingItem ? "Save Changes" : "Create Service"}
          </button>
        </form>
      </Modal>

      <ConfirmModal 
        isOpen={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        onConfirm={handleConfirmDelete} 
        title="Delete Service" 
        message={`Are you sure you want to remove the service: ${itemToDelete?.title}? This action cannot be undone.`} 
      />
    </div>
  );
};

export default Services;
