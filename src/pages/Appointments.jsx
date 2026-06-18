import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, Clock, MapPin, Phone, User, Loader2, Info } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { fetchSpecialties, createAppointment } from '../api';

const Appointments = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState(null);
  const [appointments, setAppointments] = useState(() => JSON.parse(localStorage.getItem('respira_appts_list')) || []);
  const [specialties, setSpecialties] = useState([]);
  const [loadingSpecs, setLoadingSpecs] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [apiSuccess, setApiSuccess] = useState(null);
  const [apiError, setApiError] = useState(null);

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
    localStorage.setItem('respira_appts_list', JSON.stringify(appointments));
  }, [appointments]);

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

  const handleDeleteClick = (id) => {
    setIdToDelete(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (idToDelete) {
      setAppointments(appointments.filter(a => a.id !== idToDelete));
      setIdToDelete(null);
    }
  };

  const selectedSpecialty = specialties.find(s => s.id === parseInt(formData.specialtyId));
  const availableConditions = selectedSpecialty ? selectedSpecialty.conditions || [] : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setApiSuccess(null);
    setApiError(null);

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
      // POST to live API
      const result = await createAppointment(payload);
      
      const conditionName = availableConditions.find(c => c.id === parseInt(formData.conditionId))?.name || 'General';
      const specialtyName = selectedSpecialty?.name || 'General';

      // Save locally so it appears in our dashboard lists
      const localRecord = {
        id: result.appointment_id || Date.now(),
        full_name: formData.full_name,
        phone: formData.phone,
        address: `${formData.address}, ${formData.pincode}`,
        specialty: specialtyName,
        condition: conditionName,
        date: formData.date,
        time_slot: formData.time_slot,
        status: result.status || 'pending',
        is_api_synced: true
      };

      setAppointments([localRecord, ...appointments]);
      setApiSuccess(result.detail || "Appointment booked successfully on the live API!");
      
      // Reset form on success after a delay
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

      <div className="mb-6 bg-cyan-50/50 border border-cyan-100 p-4 rounded-2xl flex items-center gap-3">
        <Info size={20} className="text-cyan-700 shrink-0" />
        <p className="text-cyan-800 text-sm leading-relaxed">
          <b>Live Backend Integration:</b> Creating a new appointment triggers a live `POST` request directly to `https://api.husnoorinfotech.in/api/appointments/`. Since GET lists are write-restricted, the dashboard stores a copy of your bookings in the local session list below.
        </p>
      </div>

      {appointments.length === 0 ? (
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
                {appointments.map(a => (
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
                      <div className="text-sm font-semibold text-slate-800">{a.specialty}</div>
                      <div className="text-xs text-slate-400">{a.condition}</div>
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
                      <div className="flex items-center gap-1">
                        <MapPin size={14} className="text-slate-400 shrink-0" /> {a.address}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${a.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button 
                        onClick={() => handleDeleteClick(a.id)} 
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Delete locally"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Appointment Booking">
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
                  <Loader2 size={18} className="animate-spin" /> Submitting Live Booking...
                </>
              ) : (
                "Book Appointment"
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
        message="Are you sure you want to delete this appointment from your local session list?" 
      />
    </div>
  );
};

export default Appointments;