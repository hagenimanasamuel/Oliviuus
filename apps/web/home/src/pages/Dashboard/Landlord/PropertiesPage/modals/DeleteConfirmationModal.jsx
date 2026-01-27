// src/pages/Dashboard/Landlord/pages/components/modals/DeleteConfirmationModal.jsx
import React from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, propertyTitle, deleting }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 transform transition-all duration-300 scale-100">
        <div className="w-16 h-16 bg-gradient-to-br from-rose-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-rose-500" />
        </div>
        
        <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Delete Property</h3>
        <p className="text-slate-600 text-center mb-6">
          Are you sure you want to delete <span className="font-semibold">"{propertyTitle}"</span>? 
          This action cannot be undone and will remove all property data including images.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-xl disabled:opacity-50 transition-all flex items-center justify-center"
          >
            {deleting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Property'
            )}
          </button>
          
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;