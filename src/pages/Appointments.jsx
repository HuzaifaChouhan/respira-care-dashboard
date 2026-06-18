import React, { useState, useEffect } from 'react';
import { Plus, Check, X, Calendar, Clock, MapPin, Phone, User, Loader2, Info, Edit3, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { fetchSpecialties, createAppointment, fetchAppointments, updateAppointmentStatus } from '../api';

const Appointments = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loadingAppts, setLoadingAppts] = useState(true);
  const [specialties, setSpecialties] = useState([]);
  const [loadingSpecs, setLoadingSpecs] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [apiSuccess, setApiSuccess] = useState(null);
  const [apiError, setApiError] = useState(null);

  const [deletedIds, setDeletedIds] = useState(() => JSON.parse(localStorage.getItem('respira_deleted_appts')) || []);
  const [editedOverrides, setEditedOverrides] = useState(() => JSON.parse(localStorage.getItem('respira_edited_appts')) || {});

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
    pincode: '',
    specialtyId: '',
    conditionId: '',
    date: '',
    time_slot: ''
  });

  useEffect(() => {
    localStorage.setItem('respira_deleted_appts', JSON.stringify(deletedIds));
  }, [deletedIds]);

  useEffect(() => {
    localStorage.setItem('respira_edited_appts', JSON.stringify(editedOverrides));
  }, [editedOverrides]);

  async function loadAppointmentsData() {
    try {
      setLoadingAppts(true);
      const data = await fetchAppointments();
      setAppointments(data);
    } catch (err) {
      console.error("Failed to load appointments:", err);
    } finally {
      setLoadingAppts(false);
    }
  }

  useEffect(() => {
    loadAppointmentsData();
  }, []);

  useEffect(() => {
    async function loadSpecialties() {
      try {
        setLoadingSpecs(true);
        const data = await fetchSpecialties();
        setSpecialties(data);
      } catch (err) {
        console.error("Failed to load specialties for appointment form:", err);
      } finally {
        setLoadingSpecs(false);
      }
    }
    loadSpecialties();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      full_name: '',
      phone: '',
      address: '',
      pincode: '',
      specialtyId: '',
      conditionId: '',
      date: '',
      time_slot: ''
    });
    setApiSuccess(null);
    setApiError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (appt) => {
    setEditingId(appt.id);
    
    // Attempt to map names back to local IDs
    const matchedSpec = specialties.find(s => s.name === appt.specialty_name || s.name === appt.specialty);
    const specId = matchedSpec ? matchedSpec.id.toString() : '';
    
    const matchedCond = matchedSpec ? (matchedSpec.conditions || []).find(c => c.name === appt.condition_name || c.name === appt.condition) : null;
    const condId = matchedCond ? matchedCond.id.toString() : '';

    setFormData({
      full_name: appt.full_name,
      phone: appt.phone,
      address: appt.address,
      pincode: appt.pincode || '',
      specialtyId: specId,
      conditionId: condId,
      date: appt.date,
      time_slot: appt.time_slot
    });
    setApiSuccess(null);
    setApiError(null);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id) => {
    setIdToDelete(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (idToDelete) {
      try {
        await updateAppointmentStatus(idToDelete, 'cancelled');
      } catch (err) {
        console.error("Failed to cancel booking on backend:", err);
      }
      setDeletedIds(prev => [...prev, idToDelete]);
      setIdToDelete(null);
      setIsConfirmOpen(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateAppointmentStatus(id, newStatus);
      const data = await fetchAppointments();
      setAppointments(data);
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed to update appointment status on the live database.");
    }
  };

  const selectedSpecialty = specialties.find(s => s.id === parseInt(formData.specialtyId));
  const availableConditions = selectedSpecialty ? selectedSpecialty.conditions || [] : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setApiSuccess(null);
    setApiError(null);

    const conditionName = availableConditions.find(c => c.id === parseInt(formData.conditionId))?.name || 'General';
    const specialtyName = selectedSpecialty?.name || 'General';

    if (editingId) {
      // Edit mode: save overrides in localStorage
      const updatedFields = {
        full_name: formData.full_name,
        phone: formData.phone,
        address: formData.address,
        pincode: formData.pincode,
        specialty_name: specialtyName,
        specialty: specialtyName,
        condition_name: conditionName,
        condition: conditionName,
        date: formData.date,
        time_slot: formData.time_slot
      };

      setEditedOverrides(prev => ({
        ...prev,
        [editingId]: updatedFields
      }));

      setApiSuccess("Appointment details updated successfully!");
      setTimeout(() => {
        setIsModalOpen(false);
        setEditingId(null);
        setApiSuccess(null);
      }, 1500);
      setSubmitting(false);
      return;
    }

    // Add mode: create on API
    const payload = {
      full_name: formData.full_name,
      phone: formData.phone,
      address: formData.address,
      pincode: formData.pincode,
      specialty: parseInt(formData.specialtyId),
      condition: parseInt(formData.conditionId),
      date: formData.date,
      time_slot: formData.time_slot
    };

    try {
      const result = await createAppointment(payload);
      const freshAppts = await fetchAppointments();
      setAppointments(freshAppts);
      setApiSuccess(result.detail || "Appointment booked successfully on the live API!");
      
      setTimeout(() => {
        setIsModalOpen(false);
        setApiSuccess(null);
      }, 3000);

    } catch (err) {
      console.error("Failed to book appointment on API:", err);
      let errorMsg = "Failed to book appointment. Please check field formats.";
      if (err.details) {
        errorMsg = Object.entries(err.details)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(' ') : val}`)
          .join('\n');
      }
      setApiError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const displayedAppointments = appointments
    .filter(a => !deletedIds.includes(a.id))
    .map(a => {
      if (editedOverrides[a.id]) {
        return { ...a, ...editedOverrides[a.id] };
      }
      return a;
    });

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Appointments</h1>
          <p className="text-slate-500 text-sm">Reviewing and creating patient bookings</p>
        </div>
        <button 
          onClick={handleOpenAdd} 
          disabled={loadingSpecs}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-[var(--color-brand-dark)] text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-all disabled:opacity-50"
        >
          <Plus size={20} /> New Appointment
        </button>
      </div>


      {loadingAppts ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-[32px] text-slate-400">
          <Loader2 size={40} className="animate-spin text-[var(--color-brand-dark)] mb-4" />
          <p className="font-semibold text-sm">Fetching live appointments...</p>
        </div>
      ) : displayedAppointments.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-100 rounded-[32px] text-slate-400">
          <Calendar size={48} className="mx-auto mb-4 opacity-50" />
          <p className="font-bold text-lg">No appointments recorded</p>
          <p className="text-sm">Click "New Appointment" to book one live.</p>
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="px-8 py-4">Patient details</th>
                  <th className="px-6 py-4">Specialty & Condition</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Address</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-8 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {displayedAppointments.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-8 py-5">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        {a.full_name}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone size={12} /> {a.phone}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm font-semibold text-slate-800">{a.specialty_name || a.specialty}</div>
                      <div className="text-xs text-slate-400">{a.condition_name || a.condition}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                        <Calendar size={14} className="text-slate-400" /> {a.date}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Clock size={14} className="text-slate-400" /> {a.time_slot}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-500 max-w-[200px] truncate">
                      <div className="flex items-center gap-1" title={`${a.address}${a.pincode ? ', ' + a.pincode : ''}`}>
                        <MapPin size={14} className="text-slate-400 shrink-0" /> {a.address}{a.pincode ? `, ${a.pincode}` : ''}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${a.status === 'pending' ? 'bg-amber-50 text-amber-600' : a.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenEdit(a)} 
                          className="p-2 text-slate-400 hover:text-[var(--color-brand-dark)] hover:bg-slate-50 rounded-xl transition-all"
                          title="Edit details"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(a.id)} 
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Delete Booking"
                        >
                          <Trash2 size={18} />
                        </button>

                        {a.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleStatusChange(a.id, 'approved')} 
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                              title="Approve Booking"
                            >
                              <Check size={18} />
                            </button>
                            <button 
                              onClick={() => handleStatusChange(a.id, 'cancelled')} 
                              className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                              title="Cancel Booking"
                            >
                              <X size={18} />
                            </button>
                          </>
                        )}
                        {a.status === 'approved' && (
                          <button 
                            onClick={() => handleStatusChange(a.id, 'cancelled')} 
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            title="Cancel Booking"
                          >
                            <X size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Appointment Details" : "New Appointment Booking"}>
        {apiSuccess ? (
          <div className="p-6 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl flex flex-col items-center justify-center text-center gap-2">
            <span className="font-bold text-lg">Success!</span>
            <p className="text-sm">{apiSuccess}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {apiError && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs font-medium whitespace-pre-wrap">
                {apiError}
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Patient Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input required className="w-full bg-slate-50 border border-slate-200 py-3 pl-10 pr-4 rounded-xl outline-none text-sm" placeholder="Full name" value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input required className="w-full bg-slate-50 border border-slate-200 py-3 pl-10 pr-4 rounded-xl outline-none text-sm" placeholder="10-digit number" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-500 block mb-1">Street Address</label>
                <input required className="w-full bg-slate-50 border border-slate-200 py-3 px-4 rounded-xl outline-none text-sm" placeholder="123 Main St, Apt 4" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Pincode</label>
                <input required className="w-full bg-slate-50 border border-slate-200 py-3 px-4 rounded-xl outline-none text-sm" placeholder="e.g. 400001" value={formData.pincode} onChange={(e) => setFormData({...formData, pincode: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Select Specialty</label>
                <select 
                  required 
                  className="w-full bg-slate-50 border border-slate-200 py-3 px-4 rounded-xl outline-none text-sm cursor-pointer"
                  value={formData.specialtyId}
                  onChange={(e) => setFormData({...formData, specialtyId: e.target.value, conditionId: ''})}
                >
                  <option value="">-- Choose Specialty --</option>
                  {specialties.map(spec => (
                    <option key={spec.id} value={spec.id}>{spec.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Select Condition</label>
                <select 
                  required 
                  disabled={!formData.specialtyId}
                  className="w-full bg-slate-50 border border-slate-200 py-3 px-4 rounded-xl outline-none text-sm cursor-pointer disabled:opacity-50"
                  value={formData.conditionId}
                  onChange={(e) => setFormData({...formData, conditionId: e.target.value})}
                >
                  <option value="">-- Choose Condition --</option>
                  {availableConditions.map(cond => (
                    <option key={cond.id} value={cond.id}>{cond.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Date</label>
                <input type="date" required className="w-full bg-slate-50 border border-slate-200 py-3 px-4 rounded-xl outline-none text-sm text-slate-600" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Time (24h format)</label>
                <input type="time" required className="w-full bg-slate-50 border border-slate-200 py-3 px-4 rounded-xl outline-none text-sm text-slate-600" value={formData.time_slot} onChange={(e) => setFormData({...formData, time_slot: e.target.value})} />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={submitting}
              className="w-full py-4 bg-[var(--color-brand-dark)] text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 hover:opacity-95 transition-opacity disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> {editingId ? "Saving Changes..." : "Submitting Live Booking..."}
                </>
              ) : (
                editingId ? "Save Changes" : "Book Appointment"
              )}
            </button>
          </form>
        )}
      </Modal>

      <ConfirmModal 
        isOpen={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        onConfirm={handleConfirmDelete} 
        title="Delete Appointment Record" 
        message="Are you sure you want to permanently delete this appointment from the dashboard?" 
      />
    </div>
  );
};

export default Appointments;