// src/pages/Dashboard/Landlord/pages/components/ExportPropertiesModal.jsx
import React, { useState } from 'react';
import { X, Download, FileText, FileSpreadsheet } from 'lucide-react';

export default function ExportPropertiesModal({ isOpen, onClose, onExport, propertyCount }) {
  const [format, setFormat] = useState('csv');
  const [includeImages, setIncludeImages] = useState(false);
  const [dateRange, setDateRange] = useState('all');

  const handleExport = () => {
    onExport(format);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Export Properties</h3>
            <p className="text-sm text-gray-600">Export {propertyCount} properties</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFormat('csv')}
                className={`p-4 border rounded-xl flex flex-col items-center gap-2 transition-all ${
                  format === 'csv'
                    ? 'border-[#BC8BBC] bg-[#BC8BBC]/5 ring-2 ring-[#BC8BBC]/20'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FileText className={`h-6 w-6 ${format === 'csv' ? 'text-[#BC8BBC]' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${format === 'csv' ? 'text-[#BC8BBC]' : 'text-gray-600'}`}>
                  CSV
                </span>
                <span className="text-xs text-gray-500">Excel compatible</span>
              </button>

              <button
                onClick={() => setFormat('pdf')}
                className={`p-4 border rounded-xl flex flex-col items-center gap-2 transition-all ${
                  format === 'pdf'
                    ? 'border-[#BC8BBC] bg-[#BC8BBC]/5 ring-2 ring-[#BC8BBC]/20'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FileSpreadsheet className={`h-6 w-6 ${format === 'pdf' ? 'text-[#BC8BBC]' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${format === 'pdf' ? 'text-[#BC8BBC]' : 'text-gray-600'}`}>
                  PDF
                </span>
                <span className="text-xs text-gray-500">Printable report</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
            >
              <option value="all">All Properties</option>
              <option value="month">Last 30 Days</option>
              <option value="quarter">Last 3 Months</option>
              <option value="year">Last Year</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="includeImages"
              checked={includeImages}
              onChange={(e) => setIncludeImages(e.target.checked)}
              className="w-4 h-4 text-[#BC8BBC] border-gray-300 rounded focus:ring-[#BC8BBC]"
            />
            <label htmlFor="includeImages" className="text-sm text-gray-600">
              Include image URLs in export
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-[#BC8BBC] to-[#8A5A8A] text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center"
            >
              <Download size={18} className="mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}