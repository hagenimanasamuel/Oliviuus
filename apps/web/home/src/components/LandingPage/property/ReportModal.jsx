// src/components/LandingPage/property/ReportModal.jsx
import React, { useState } from 'react';
import { X, AlertTriangle, ChevronRight, CheckCircle } from 'lucide-react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';

export default function ReportModal({ isOpen, onClose, propertyUid, propertyTitle }) {
  const [step, setStep] = useState(1); // 1: select type, 2: details, 3: success
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState({
    report_type: '',
    fake_listing_reason: '',
    price_issue_type: '',
    inaccurate_info_field: '',
    scam_type: '',
    landlord_issue_type: '',
    safety_issue_type: '',
    description: '',
    contact_allowed: false,
    contact_method: 'none',
    anonymous_name: '',
    anonymous_email: '',
    anonymous_phone: ''
  });
  const [reportUid, setReportUid] = useState('');

  const colors = {
    primary: '#BC8BBC',
    primaryDark: '#8A5A8A',
    primaryLight: '#F3E8F3'
  };

  // Report type options
  const reportTypes = [
    { id: 'fake_listing', label: 'Fake Listing', icon: '🕵️', description: 'Property doesn\'t exist or photos are fake' },
    { id: 'wrong_price', label: 'Wrong Price', icon: '💰', description: 'Price is incorrect or misleading' },
    { id: 'already_rented', label: 'Already Rented', icon: '🔒', description: 'Property is no longer available' },
    { id: 'inaccurate_info', label: 'Inaccurate Info', icon: '📝', description: 'Description, size or amenities are wrong' },
    { id: 'scam_fraud', label: 'Scam or Fraud', icon: '⚠️', description: 'Suspicious or fraudulent activity' },
    { id: 'inappropriate_content', label: 'Inappropriate', icon: '🚫', description: 'Offensive or inappropriate content' },
    { id: 'duplicate_listing', label: 'Duplicate', icon: '🔄', description: 'Same property listed multiple times' },
    { id: 'landlord_issue', label: 'Landlord Issue', icon: '👤', description: 'Problem with the landlord/host' },
    { id: 'safety_concern', label: 'Safety Concern', icon: '🛡️', description: 'Unsafe area or property conditions' },
    { id: 'other', label: 'Other', icon: '📌', description: 'Something else' }
  ];

  // Sub-reason options based on report type
  const subReasons = {
    fake_listing: [
      { id: 'property_doesnt_exist', label: 'Property doesn\'t exist' },
      { id: 'fake_photos', label: 'Photos are fake/stolen' },
      { id: 'not_available_for_rent', label: 'Not actually available for rent' },
      { id: 'different_property', label: 'Different property than photos' }
    ],
    price_issue: [
      { id: 'price_too_low', label: 'Price is too low (bait)' },
      { id: 'price_too_high', label: 'Price is too high' },
      { id: 'hidden_fees', label: 'Hidden fees not disclosed' },
      { id: 'price_changed', label: 'Price changed after inquiry' }
    ],
    inaccurate_info: [
      { id: 'location', label: 'Wrong location' },
      { id: 'size_area', label: 'Wrong size/area' },
      { id: 'amenities', label: 'Amenities don\'t exist' },
      { id: 'rooms_count', label: 'Wrong number of rooms' },
      { id: 'property_type', label: 'Wrong property type' },
      { id: 'utilities', label: 'Utilities misrepresented' }
    ],
    scam: [
      { id: 'requesting_money_before_viewing', label: 'Asking for money before viewing' },
      { id: 'too_good_to_be_true', label: 'Too good to be true price' },
      { id: 'pressure_tactics', label: 'Pressure to pay quickly' },
      { id: 'refusal_to_meet', label: 'Refuses to meet in person' },
      { id: 'fake_landlord', label: 'Not the real landlord' }
    ],
    landlord_issue: [
      { id: 'unresponsive', label: 'Unresponsive to messages' },
      { id: 'rude_behavior', label: 'Rude or unprofessional' },
      { id: 'harassment', label: 'Harassment' },
      { id: 'showing_up_unannounced', label: 'Showing up unannounced' },
      { id: 'broken_promises', label: 'Broken promises/agreements' }
    ],
    safety: [
      { id: 'unsafe_neighborhood', label: 'Unsafe neighborhood' },
      { id: 'structural_damage', label: 'Structural damage' },
      { id: 'electrical_hazard', label: 'Electrical hazard' },
      { id: 'water_contamination', label: 'Water contamination' },
      { id: 'security_concern', label: 'Security concern' }
    ]
  };

  const handleTypeSelect = (typeId) => {
    setReportData({
      ...reportData,
      report_type: typeId,
      // Reset sub-reasons when type changes
      fake_listing_reason: '',
      price_issue_type: '',
      inaccurate_info_field: '',
      scam_type: '',
      landlord_issue_type: '',
      safety_issue_type: ''
    });
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setReportData({
      ...reportData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reportData.report_type) {
      toast.error('Please select a report type');
      return;
    }

    // Validate based on report type
    if (reportData.report_type === 'other' && !reportData.description) {
      toast.error('Please provide a description');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post(`/reports/property/${propertyUid}/report`, reportData);

      if (response.data.success) {
        setReportUid(response.data.data.report.report_uid);
        setStep(3);
        toast.success('Report submitted successfully', {
          icon: '✓',
          style: {
            background: colors.primary,
            color: 'white'
          }
        });
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      
      if (error.response?.data?.code === 'ALREADY_REPORTED') {
        toast.error('You have already reported this property');
      } else {
        toast.error('Failed to submit report. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset state
    setStep(1);
    setReportData({
      report_type: '',
      fake_listing_reason: '',
      price_issue_type: '',
      inaccurate_info_field: '',
      scam_type: '',
      landlord_issue_type: '',
      safety_issue_type: '',
      description: '',
      contact_allowed: false,
      contact_method: 'none',
      anonymous_name: '',
      anonymous_email: '',
      anonymous_phone: ''
    });
    setReportUid('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-auto">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Report Property</h2>
                <p className="text-sm text-gray-500">{propertyTitle}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {step === 1 && (
              <div>
                <p className="text-gray-600 mb-4">
                  What's the issue with this property? Select the option that best describes the problem.
                </p>
                <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                  {reportTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => handleTypeSelect(type.id)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-[#BC8BBC] hover:bg-[#BC8BBC]/5 transition-all text-left group"
                    >
                      <span className="text-2xl">{type.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 group-hover:text-[#BC8BBC]">
                          {type.label}
                        </div>
                        <div className="text-sm text-gray-500">{type.description}</div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-[#BC8BBC]" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <form onSubmit={handleSubmit}>
                {/* Back button */}
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-2 text-gray-600 hover:text-[#BC8BBC] mb-4 transition-colors"
                >
                  ← Back to report types
                </button>

                {/* Selected type display */}
                <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                  <div className="text-sm text-gray-500">Reporting as:</div>
                  <div className="font-medium text-gray-900">
                    {reportTypes.find(t => t.id === reportData.report_type)?.label}
                  </div>
                </div>

                {/* Sub-reasons for specific types */}
                {reportData.report_type === 'fake_listing' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What's fake about this listing?
                    </label>
                    <select
                      name="fake_listing_reason"
                      value={reportData.fake_listing_reason}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                      required
                    >
                      <option value="">Select a reason</option>
                      {subReasons.fake_listing.map(reason => (
                        <option key={reason.id} value={reason.id}>
                          {reason.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {reportData.report_type === 'wrong_price' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What's wrong with the price?
                    </label>
                    <select
                      name="price_issue_type"
                      value={reportData.price_issue_type}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                      required
                    >
                      <option value="">Select a reason</option>
                      {subReasons.price_issue.map(reason => (
                        <option key={reason.id} value={reason.id}>
                          {reason.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {reportData.report_type === 'inaccurate_info' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What information is inaccurate?
                    </label>
                    <select
                      name="inaccurate_info_field"
                      value={reportData.inaccurate_info_field}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                      required
                    >
                      <option value="">Select a field</option>
                      {subReasons.inaccurate_info.map(reason => (
                        <option key={reason.id} value={reason.id}>
                          {reason.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {reportData.report_type === 'scam_fraud' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What scam activity?
                    </label>
                    <select
                      name="scam_type"
                      value={reportData.scam_type}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                      required
                    >
                      <option value="">Select a reason</option>
                      {subReasons.scam.map(reason => (
                        <option key={reason.id} value={reason.id}>
                          {reason.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {reportData.report_type === 'landlord_issue' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What's the issue with the landlord?
                    </label>
                    <select
                      name="landlord_issue_type"
                      value={reportData.landlord_issue_type}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                      required
                    >
                      <option value="">Select a reason</option>
                      {subReasons.landlord_issue.map(reason => (
                        <option key={reason.id} value={reason.id}>
                          {reason.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {reportData.report_type === 'safety_concern' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What's the safety concern?
                    </label>
                    <select
                      name="safety_issue_type"
                      value={reportData.safety_issue_type}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                      required
                    >
                      <option value="">Select a reason</option>
                      {subReasons.safety.map(reason => (
                        <option key={reason.id} value={reason.id}>
                          {reason.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Description field (required for 'other', optional otherwise) */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description {reportData.report_type === 'other' && '(required)'}
                  </label>
                  <textarea
                    name="description"
                    value={reportData.description}
                    onChange={handleInputChange}
                    placeholder="Please provide more details about the issue..."
                    rows="4"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent resize-none"
                    required={reportData.report_type === 'other'}
                  />
                </div>

                {/* Anonymous reporter info */}
                <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                  <h3 className="font-medium text-gray-900 mb-3">Your Information (Optional)</h3>
                  
                  <div className="space-y-3">
                    <input
                      type="text"
                      name="anonymous_name"
                      value={reportData.anonymous_name}
                      onChange={handleInputChange}
                      placeholder="Your name"
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                    />
                    
                    <input
                      type="email"
                      name="anonymous_email"
                      value={reportData.anonymous_email}
                      onChange={handleInputChange}
                      placeholder="Email address"
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                    />
                    
                    <input
                      type="tel"
                      name="anonymous_phone"
                      value={reportData.anonymous_phone}
                      onChange={handleInputChange}
                      placeholder="Phone number"
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                    />
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="contact_allowed"
                      name="contact_allowed"
                      checked={reportData.contact_allowed}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-[#BC8BBC] border-gray-300 rounded focus:ring-[#BC8BBC]"
                    />
                    <label htmlFor="contact_allowed" className="text-sm text-gray-600">
                      I'm willing to be contacted about this report
                    </label>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#BC8BBC] to-[#8A5A8A] text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit Report'}
                </button>

                <p className="text-xs text-gray-500 text-center mt-3">
                  Your report will be reviewed by our team. We take all reports seriously.
                </p>
              </form>
            )}

            {step === 3 && (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Report Submitted!</h3>
                <p className="text-gray-600 mb-4">
                  Thank you for helping keep our community safe. Our team will review your report.
                </p>
                {reportUid && (
                  <div className="bg-gray-50 p-3 rounded-lg mb-4">
                    <p className="text-xs text-gray-500">Report Reference</p>
                    <p className="text-sm font-mono text-gray-700">{reportUid}</p>
                  </div>
                )}
                <button
                  onClick={handleClose}
                  className="px-6 py-2 bg-[#BC8BBC] text-white rounded-lg hover:bg-[#8A5A8A] transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}