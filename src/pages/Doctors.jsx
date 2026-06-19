import React, { useState, useEffect } from 'react';
import { Plus, UserRound, Trash2, Edit3, Loader2, ExternalLink } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { fetchDoctors, fetchSpecialties, createDoctor, updateDoctor, deleteDoctor, uploadImage } from '../api';

const DoctorImage = ({ src, alt, className }) => {
  const [currentSrc, setCurrentSrc] = useState('');
  const [error, setError] = useState(false);
  const [extIndex, setExtIndex] = useState(0);
  const extensions = ['.jpg', '.png', '.jpeg', '.webp'];

  useEffect(() => {
    setError(false);
    setExtIndex(0);
    if (src && src.includes('files.catbox.moe') && !src.match(/\.(png|jpg|jpeg|gif|webp|svg)/i)) {
      setCurrentSrc(`${src}.jpg`);
    } else {
      setCurrentSrc(src || '');
    }
  }, [src]);

  const handleImageError = () => {
    if (src && src.includes('files.catbox.moe') && !src.match(/\.(png|jpg|jpeg|gif|webp|svg)/i)) {
      const nextIndex = extIndex + 1;
      if (nextIndex < extensions.length) {
        setExtIndex(nextIndex);
        setCurrentSrc(`${src}${extensions[nextIndex]}`);
      } else {
        setError(true);
      }
    } else {
      setError(true);
    }
  };

  const defaultClass = "w-30 h-40 rounded-xl object-cover border border-slate-100";

  if (!currentSrc || error) {
    return (
      <div className={className || "w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center text-[var(--color-brand-dark)]"}>
        <UserRound size={24} />
      </div>
    );
  }

  return (
    <img 
      src={currentSrc} 
      alt={alt} 
      className={className || defaultClass}
      onError={handleImageError}
    />
  );
};

const Doctors = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    specialty: '', // Will store specialty ID
    qualification: '',
    experience_years: '',
    bio: '',
    photo: ''
  });

  const [uploadingImage, setUploadingImage] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    setError(null);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = async () => {
        // Limit dimensions to 800px width/height maximum
        const maxDim = 800;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Compress as 80% quality JPEG
        const base64Data = canvas.toDataURL('image/jpeg', 0.8);
        
        try {
          const res = await uploadImage(base64Data);
          if (res && res.url) {
            setFormData(prev => ({ ...prev, photo: res.url }));
          } else {
            setError("Failed to upload image: No URL returned from upload provider.");
          }
        } catch (err) {
          console.error("Image upload failed:", err);
          const detailMsg = err.details?.message || err.details?.error || "Please try again.";
          setError(`Failed to upload image from device. (${detailMsg})`);
        } finally {
          setUploadingImage(false);
        }
      };
      img.onerror = () => {
        setError("Failed to process image file.");
        setUploadingImage(false);
      };
    };
    reader.onerror = () => {
      setError("Failed to read image file.");
      setUploadingImage(false);
    };
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [apiDoctors, apiSpecialties] = await Promise.all([
        fetchDoctors(),
        fetchSpecialties()
      ]);
      setDoctors(apiDoctors);
      setSpecialties(apiSpecialties);
      setError(null);
    } catch (err) {
      console.error("Error loading doctors/specialties:", err);
      setError("Failed to sync with live API. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({ name: '', specialty: '', qualification: '', experience_years: '', bio: '', photo: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (doc) => {
    setEditingItem(doc);
    // Find matching specialty ID from the name
    const matchedSpec = specialties.find(s => s.name === doc.specialty_name);
    setFormData({
      name: doc.name || '',
      specialty: matchedSpec ? matchedSpec.id.toString() : '',
      qualification: doc.qualification || '',
      experience_years: doc.experience_years || '',
      bio: doc.bio || '',
      photo: doc.photo_url || ''
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (doc) => {
    setItemToDelete(doc);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setLoading(true);
      await deleteDoctor(itemToDelete.id);
      // Remove from state immediately
      setDoctors(doctors.filter(d => d.id !== itemToDelete.id));
      setItemToDelete(null);
      setError(null);
    } catch (err) {
      console.error("Failed to delete doctor:", err);
      setError("Failed to delete doctor from the live database.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    let photoPayload = formData.photo || null;
    if (photoPayload && (photoPayload.startsWith('http://') || photoPayload.startsWith('https://'))) {
      const match = photoPayload.match(/\.(png|jpg|jpeg|gif|webp|svg)/i);
      if (match) {
        if (!photoPayload.toLowerCase().endsWith(match[0].toLowerCase())) {
          photoPayload = photoPayload + match[0];
        }
      } else {
        photoPayload = photoPayload + '.jpg';
      }
    }

    const payload = {
      name: formData.name,
      specialty: formData.specialty ? parseInt(formData.specialty) : null,
      qualification: formData.qualification,
      experience_years: parseInt(formData.experience_years) || 0,
      bio: formData.bio,
      photo: photoPayload,
      is_active: true
    };

    try {
      if (editingItem) {
        await updateDoctor(editingItem.id, payload);
      } else {
        await createDoctor(payload);
      }
      
      // Refresh list to pull updated/created names and references from backend
      const updatedDocs = await fetchDoctors();
      setDoctors(updatedDocs);
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to save doctor:", err);
      let errMsg = "Failed to save changes to database.";
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
          <h1 className="text-3xl font-bold text-slate-900">Doctors</h1>
          <p className="text-slate-500 text-sm">Auditing and managing clinic staff profiles</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={handleOpenAdd} 
            disabled={loading}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-[var(--color-brand-dark)] text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-all disabled:opacity-50"
          >
            <Plus size={20} /> Add Doctor
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
          <span className="font-semibold text-sm">Syncing with Django database...</span>
        </div>
      ) : (
        <>
          {doctors.length === 0 ? (
            <div className="text-center py-20 bg-white border border-slate-100 rounded-[32px] text-slate-400">
              <UserRound size={48} className="mx-auto mb-4 opacity-50" />
              <p className="font-bold text-lg">No doctors found</p>
              <p className="text-sm">Click "Add Doctor" to create a new profile.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctors.map(doc => (
                <div key={doc.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm relative group flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <DoctorImage src={doc.photo_url} alt={doc.name} />
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
                    <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">Live Sync</span>
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
            <input required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:border-[var(--color-brand-primary)] text-sm" placeholder="Dr. John Doe" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Select Specialty</label>
            <select 
              required 
              className="w-full bg-slate-50 border border-slate-200 py-3.5 px-4 rounded-2xl outline-none text-sm cursor-pointer"
              value={formData.specialty}
              onChange={(e) => setFormData({...formData, specialty: e.target.value})}
            >
              <option value="">-- Choose Specialty --</option>
              {specialties.map(spec => (
                <option key={spec.id} value={spec.id}>{spec.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Qualification</label>
              <input required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:border-[var(--color-brand-primary)] text-sm" placeholder="BPT, MPT" value={formData.qualification} onChange={(e) => setFormData({...formData, qualification: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Years of Experience</label>
              <input type="number" required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:border-[var(--color-brand-primary)] text-sm" placeholder="e.g. 5" value={formData.experience_years} onChange={(e) => setFormData({...formData, experience_years: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-2">Doctor Photo</label>
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-cyan-50 flex items-center justify-center border border-slate-100 shrink-0">
                {formData.photo ? (
                  <DoctorImage 
                    src={formData.photo} 
                    alt="Preview" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <UserRound size={28} className="text-[var(--color-brand-dark)]" />
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex gap-2">
                  <label className="cursor-pointer bg-[var(--color-brand-dark)] hover:opacity-90 text-white px-4 py-2 rounded-xl text-xs font-bold active:scale-95 transition-all flex items-center gap-1.5 shadow-sm">
                    {uploadingImage ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Plus size={12} />
                        <span>Upload Photo</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      disabled={uploadingImage}
                      onChange={handleFileUpload} 
                    />
                  </label>
                  {formData.photo && (
                    <button 
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, photo: '' }))}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition-all active:scale-95"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">Supported formats: JPG, PNG, WEBP (Max 4MB)</p>
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Professional Bio</label>
            <textarea className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:border-[var(--color-brand-primary)] h-24 resize-none text-sm" placeholder="Short description of the doctor's experience..." value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} />
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
              editingItem ? "Save Changes" : "Create Profile"
            )}
          </button>
        </form>
      </Modal>

      <ConfirmModal 
        isOpen={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        onConfirm={handleConfirmDelete} 
        title="Delete Doctor Profile" 
        message={`Are you sure you want to permanently remove ${itemToDelete?.name}? This action immediately updates the central database.`} 
      />
    </div>
  );
};

export default Doctors;