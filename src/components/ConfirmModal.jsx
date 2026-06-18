import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Delete", cancelText = "Cancel" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header bar with close button */}
        <div className="flex justify-end p-4 pb-0">
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="px-8 pb-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-5 animate-bounce">
            <AlertTriangle size={32} />
          </div>
          
          <h3 className="text-xl font-bold text-slate-950 mb-2">{title || "Confirm Action"}</h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-8">{message || "Are you sure you want to proceed?"}</p>
          
          {/* Action Buttons */}
          <div className="flex gap-4 w-full">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all active:scale-[0.98]"
            >
              {cancelText}
            </button>
            <button 
              type="button" 
              onClick={() => {
                onConfirm();
                onClose();
              }} 
              className="flex-1 py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-100 transition-all active:scale-[0.98]"
            >
              {confirmText}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ConfirmModal;
